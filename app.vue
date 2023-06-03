<script>
if (process.client) {
    window.addEventListener("resize", () => {
        document.documentElement.style.setProperty("--vh", `${window.visualViewport.height * 0.01}px`)
    })
}
</script>