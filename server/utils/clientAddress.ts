import { BlockList, isIP } from "node:net"
import type { H3Event } from "h3"

let cachedProxyConfig: string | undefined
let cachedTrustedProxies = new BlockList()

function normalizeAddress(address: string): string {
    const mappedIpv4 = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
    return mappedIpv4?.[1] ?? address
}

function trustedProxyList(config: string): BlockList {
    if (config === cachedProxyConfig) {
        return cachedTrustedProxies
    }

    const list = new BlockList()
    for (const configuredRange of config.split(",")) {
        const [configuredAddress, prefix, ...extra] = configuredRange.trim().split("/")
        const address = normalizeAddress(configuredAddress ?? "")
        const family = isIP(address)
        if (!family || extra.length > 0) {
            continue
        }

        const blockListFamily = family === 4 ? "ipv4" : "ipv6"
        if (prefix === undefined) {
            list.addAddress(address, blockListFamily)
            continue
        }

        const prefixLength = Number(prefix)
        const maxPrefixLength = family === 4 ? 32 : 128
        if (!/^\d+$/.test(prefix) || prefixLength === 0 || prefixLength > maxPrefixLength) {
            continue
        }

        list.addSubnet(address, prefixLength, blockListFamily)
    }

    cachedProxyConfig = config
    cachedTrustedProxies = list
    return list
}

export type ClientAddress = {
    socketAddress: string | undefined
    forwardedFor: string | undefined
    proxyConfig: string
}

export function resolveClientAddress(client: ClientAddress): string {
    const socketIp = normalizeAddress(client.socketAddress ?? "")
    const socketFamily = isIP(socketIp)
    if (!socketFamily) {
        return "unknown"
    }

    const trustedProxies = trustedProxyList(client.proxyConfig)
    const socketFamilyName = socketFamily === 4 ? "ipv4" : "ipv6"
    if (!trustedProxies.check(socketIp, socketFamilyName)) {
        return socketIp
    }

    if (!client.forwardedFor) {
        return socketIp
    }

    const forwardedAddresses = client.forwardedFor.split(",").map(value => normalizeAddress(value.trim()))
    if (forwardedAddresses.some(address => !isIP(address))) {
        return socketIp
    }

    let clientAddress = socketIp
    for (let index = forwardedAddresses.length - 1; index >= 0; index--) {
        const family = isIP(clientAddress)
        if (!family || !trustedProxies.check(clientAddress, family === 4 ? "ipv4" : "ipv6")) {
            break
        }
        clientAddress = forwardedAddresses[index]!
    }

    return clientAddress
}

export function getClientAddress(event: H3Event): string {
    const config = useRuntimeConfig(event)
    return resolveClientAddress({
        socketAddress: getRequestIP(event, { xForwardedFor: false }),
        forwardedFor: getHeader(event, "x-forwarded-for"),
        proxyConfig: config.trustedProxies,
    })
}