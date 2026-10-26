[CmdletBinding()]
param(
   [string]$RepositoryRoot,
   [ValidateRange(1, 50)]
   [int]$Limit = 5
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepositoryRoot)) {
   $RepositoryRoot = Split-Path -Parent $PSScriptRoot
}

$repositoryPath = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$ticketsRoot = Join-Path $repositoryPath 'docs\tickets'
if (-not (Test-Path -LiteralPath $ticketsRoot -PathType Container)) {
   throw "Ticket directory not found: $ticketsRoot"
}

function Get-SectionContent {
   param(
      [string]$Text,
      [string]$Name
   )

   $pattern = '(?ms)^## ' + [regex]::Escape($Name) + '\s*\r?\n(?<Content>.*?)(?=^## |\z)'
   $match = [regex]::Match($Text, $pattern)
   if ($match.Success) { return $match.Groups['Content'].Value }
   return ''
}

function Get-StatusField {
   param(
      [string]$Status,
      [string]$Name
   )

   $match = [regex]::Match($Status, '(?m)^- ' + [regex]::Escape($Name) + ':\s*(?<Value>.*)$')
   if ($match.Success) { return $match.Groups['Value'].Value.Trim().Trim([char]96) }
   return ''
}

$files = Get-ChildItem -LiteralPath $ticketsRoot -Recurse -File -Filter '*.md' |
   Where-Object { $_.Name -ne '_template.md' }
$tickets = @()
$expectedSections = @('Status', 'Dependencies', 'Goal', 'Requirements', 'Tasks', 'Notes', 'Relevant Files', 'Progress Log')
$requiredSections = @('Status', 'Goal', 'Requirements', 'Tasks', 'Notes', 'Relevant Files', 'Progress Log')

foreach ($file in $files) {
   $text = Get-Content -LiteralPath $file.FullName -Raw
   $heading = [regex]::Match($text, '(?m)^# Ticket (?<Id>\d+):\s*(?<Title>.+)$')
   if (-not $heading.Success) { continue }

   $id = $heading.Groups['Id'].Value
   $relativeDirectory = $file.DirectoryName.Substring($ticketsRoot.TrimEnd('\', '/').Length).Trim('\', '/')
   $folder = if ([string]::IsNullOrEmpty($relativeDirectory)) { 'root' } else { ($relativeDirectory -split '[/\\]')[0] }
   $statusSection = Get-SectionContent -Text $text -Name 'Status'
   $state = Get-StatusField -Status $statusSection -Name 'State'
   $priority = Get-StatusField -Status $statusSection -Name 'Priority'
   $next = Get-StatusField -Status $statusSection -Name 'Next'
   $dependencySection = Get-SectionContent -Text $text -Name 'Dependencies'
   $dependencies = @(
      [regex]::Matches($dependencySection, '(?m)^\s*- \[(?<Id>\d+)\]\((?<Path>[^)]+)\):\s*(?<Reason>.*)$') |
         ForEach-Object {
            [pscustomobject]@{
               Id = $_.Groups['Id'].Value
               Path = $_.Groups['Path'].Value
               Reason = $_.Groups['Reason'].Value
            }
         }
   )

   $lane = switch ($state) {
      'In Progress' { 'In Progress' }
      'Paused' { 'Paused' }
      'Blocked' { 'Blocked' }
      'Completed' { 'Completed' }
      'Planned' {
         if ($folder -eq 'root') { 'Planned' }
         elseif ($folder -eq 'backlog') { 'Backlog' }
         else { 'Invalid' }
      }
      default { 'Invalid' }
   }

   $headings = @([regex]::Matches($text, '(?m)^##\s+(.+?)\s*$') | ForEach-Object { $_.Groups[1].Value.Trim() })
   $missingSections = @($requiredSections | Where-Object { $_ -notin $headings })
   $presentExpected = @($expectedSections | Where-Object { $_ -in $headings })
   $actualExpected = @($headings | Where-Object { $_ -in $expectedSections })
   $unexpectedSections = @($headings | Where-Object { $_ -notin $expectedSections })
   $sectionOrderValid = (($presentExpected -join '|') -eq ($actualExpected -join '|'))

   $progressSection = Get-SectionContent -Text $text -Name 'Progress Log'
   $progressEntries = @([regex]::Matches($progressSection, '(?m)^\s*- (?<Date>\d{4}-\d{2}-\d{2}):(?<Text>[^\r\n]*)'))
   $progressDates = @($progressEntries | ForEach-Object { $_.Groups['Date'].Value })
   $progressOrderValid = $true
   for ($index = 1; $index -lt $progressDates.Count; $index++) {
      if ($progressDates[$index] -gt $progressDates[$index - 1]) { $progressOrderValid = $false }
   }
   $latestProgress = if ($progressEntries.Count) { $progressEntries[0].Value.Trim() } else { '' }

   $tickets += [pscustomobject]@{
      Id = $id
      Title = $heading.Groups['Title'].Value.Trim()
      File = $file.FullName
      Folder = $folder
      State = $state
      Priority = $priority
      Next = $next
      Dependencies = $dependencies
      Lane = $lane
      MissingSections = $missingSections
      UnexpectedSections = $unexpectedSections
      SectionOrderValid = $sectionOrderValid
      ProgressOrderValid = $progressOrderValid
      LatestProgress = $latestProgress
   }
}

$byId = @{}
foreach ($ticket in $tickets) { $byId[$ticket.Id] = $ticket }

foreach ($ticket in $tickets) {
   $pendingDependencies = @(
      foreach ($dependency in $ticket.Dependencies) {
         if (-not $byId.ContainsKey($dependency.Id) -or $byId[$dependency.Id].State -ne 'Completed') {
            $dependency
         }
      }
   )
   $ticket | Add-Member -NotePropertyName PendingDependencies -NotePropertyValue $pendingDependencies

   $issues = [System.Collections.Generic.List[string]]::new()
   if (-not $ticket.State) { $issues.Add('missing State') }
   elseif ($ticket.State -notin @('Planned', 'In Progress', 'Paused', 'Blocked', 'Completed')) { $issues.Add("invalid State '$($ticket.State)'") }
   if (-not $ticket.Priority) { $issues.Add('missing Priority') }
   elseif ($ticket.Priority -notin @('High', 'Medium', 'Low')) { $issues.Add("invalid Priority '$($ticket.Priority)'") }
   if (-not $ticket.Next) { $issues.Add('missing Next') }
   elseif ($ticket.State -eq 'Completed' -and $ticket.Next -ne 'None') { $issues.Add('completed ticket should use Next: None') }
   elseif ($ticket.State -ne 'Completed' -and $ticket.Next -eq 'None') { $issues.Add('unfinished ticket needs a concrete Next step') }
   if ($ticket.Folder -notin @('root', 'backlog', 'completed')) { $issues.Add("unexpected folder '$($ticket.Folder)'") }
   if ($ticket.Folder -eq 'completed' -and $ticket.State -ne 'Completed') { $issues.Add('completed folder has unfinished state') }
   if ($ticket.Folder -ne 'completed' -and $ticket.State -eq 'Completed') { $issues.Add('completed state is outside completed folder') }
   if ($ticket.MissingSections.Count) { $issues.Add('missing sections: ' + ($ticket.MissingSections -join ', ')) }
   if ($ticket.UnexpectedSections.Count) { $issues.Add('unexpected sections: ' + ($ticket.UnexpectedSections -join ', ')) }
   if (-not $ticket.SectionOrderValid) { $issues.Add('sections are out of template order') }
   if (-not $ticket.ProgressOrderValid) { $issues.Add('progress log is not newest first') }
   $ticket | Add-Member -NotePropertyName Issues -NotePropertyValue @($issues)
}

$laneNames = @('In Progress', 'Paused', 'Blocked', 'Planned', 'Backlog', 'Completed', 'Invalid')
Write-Output 'ClassicForum ticket snapshot (counts come from ticket files, not an external tracker)'
Write-Output ('Tickets scanned: {0}' -f $tickets.Count)
Write-Output 'Lane counts:'
foreach ($laneName in $laneNames) {
   $count = @($tickets | Where-Object Lane -eq $laneName).Count
   if ($count -gt 0) { Write-Output ('  {0}: {1}' -f $laneName, $count) }
}

$priorityBuckets = [ordered]@{
   'Active/root' = @($tickets | Where-Object { $_.Folder -eq 'root' -and $_.State -in @('Planned', 'In Progress') })
   'Paused' = @($tickets | Where-Object State -eq 'Paused')
   'Blocked' = @($tickets | Where-Object State -eq 'Blocked')
   'Backlog' = @($tickets | Where-Object { $_.Folder -eq 'backlog' -and $_.State -eq 'Planned' })
   'Completed' = @($tickets | Where-Object State -eq 'Completed')
}
Write-Output 'Priority counts (High/Medium/Low):'
foreach ($bucket in $priorityBuckets.GetEnumerator()) {
   $counts = foreach ($priorityName in 'High', 'Medium', 'Low') {
      '{0}={1}' -f $priorityName, @($bucket.Value | Where-Object Priority -eq $priorityName).Count
   }
   Write-Output ('  {0}: {1}' -f $bucket.Key, ($counts -join ', '))
}

Write-Output 'Current work:'
$currentWork = @($tickets | Where-Object { $_.State -in @('In Progress', 'Paused', 'Blocked') } | Sort-Object { [int]$_.Id })
if (-not $currentWork.Count) { Write-Output '  None' }
foreach ($ticket in $currentWork) {
   $progress = if ($ticket.LatestProgress) { '; latest: ' + $ticket.LatestProgress } else { '' }
   Write-Output ('  {0} [{1}, {2}] {3} | Next: {4}{5}' -f $ticket.Id, $ticket.State, $ticket.Priority, $ticket.Title, $ticket.Next, $progress)
}

$rootPlanned = @($tickets | Where-Object { $_.Folder -eq 'root' -and $_.State -eq 'Planned' })
$readyCandidates = @($rootPlanned | Where-Object { $_.PendingDependencies.Count -eq 0 })
$candidatePriority = $null
$candidates = @()
foreach ($priorityName in 'High', 'Medium') {
   $matchingReady = @($readyCandidates | Where-Object Priority -eq $priorityName)
   if ($matchingReady.Count) {
      $candidatePriority = $priorityName
      $candidates = $matchingReady
      break
   }
}
if (-not $candidates.Count) {
   foreach ($priorityName in 'High', 'Medium') {
      $matching = @($rootPlanned | Where-Object Priority -eq $priorityName)
      if ($matching.Count) {
         $candidatePriority = $priorityName
         $candidates = $matching
         break
      }
   }
}
Write-Output 'Next work candidates (root planned):'
if (-not $candidates.Count) {
   Write-Output '  None at High or Medium priority'
} else {
   $shownCandidates = @($candidates | Sort-Object { [int]$_.Id } | Select-Object -First $Limit)
   Write-Output ('  {0} priority; showing {1} of {2}' -f $candidatePriority, $shownCandidates.Count, $candidates.Count)
   foreach ($ticket in $shownCandidates) {
      $dependencyNote = if ($ticket.PendingDependencies.Count) {
         ' | prerequisite pending: ' + (($ticket.PendingDependencies | ForEach-Object { $_.Id }) -join ', ')
      } else { '' }
      Write-Output ('  {0} {1} | Next: {2}{3}' -f $ticket.Id, $ticket.Title, $ticket.Next, $dependencyNote)
   }
}

Write-Output 'Cleanup:'
$qualityIssues = @($tickets | Where-Object { $_.Issues.Count -gt 0 })
if (-not $qualityIssues.Count) { Write-Output '  None' }
foreach ($ticket in $qualityIssues) {
   Write-Output ('  {0}: {1}' -f $ticket.Id, ($ticket.Issues -join '; '))
}

Write-Output 'Dependency warnings:'
$dependencyWarnings = [System.Collections.Generic.List[string]]::new()
foreach ($ticket in $tickets) {
   foreach ($dependency in $ticket.Dependencies) {
      if ($dependency.Id -eq $ticket.Id) {
         $dependencyWarnings.Add("$($ticket.Id) depends on itself")
      } elseif (-not $byId.ContainsKey($dependency.Id)) {
         $dependencyWarnings.Add("$($ticket.Id) has unknown dependency $($dependency.Id)")
      } elseif ($byId[$dependency.Id].State -ne 'Completed') {
         $dependencyWarnings.Add("$($ticket.Id) depends on unfinished ticket $($dependency.Id) ($($byId[$dependency.Id].State))")
      }
   }
}

$script:ticketById = $byId
$script:visitState = @{}
$script:cycleWarnings = [System.Collections.Generic.List[string]]::new()
function Visit-TicketDependency {
   param(
      [string]$Id,
      [string[]]$Path
   )

   if ($Path -contains $Id) {
      $script:cycleWarnings.Add((@($Path + $Id) -join ' -> '))
      return
   }
   if ($script:visitState[$Id] -eq 'Done') { return }
   $script:visitState[$Id] = 'Visiting'
   $nextPath = @($Path + $Id)
   foreach ($dependency in $script:ticketById[$Id].Dependencies) {
      if ($script:ticketById.ContainsKey($dependency.Id)) {
         Visit-TicketDependency -Id $dependency.Id -Path $nextPath
      }
   }
   $script:visitState[$Id] = 'Done'
}
foreach ($ticket in $tickets) { Visit-TicketDependency -Id $ticket.Id -Path @() }
foreach ($cycle in $script:cycleWarnings | Select-Object -Unique) { $dependencyWarnings.Add("dependency cycle: $cycle") }
if (-not $dependencyWarnings.Count) { Write-Output '  None' }
foreach ($warning in $dependencyWarnings) { Write-Output ('  {0}' -f $warning) }