package com.asms.identity.security;

import java.net.Inet6Address;
import java.net.InetAddress;

public final class IpAddressAnonymizer {

    private IpAddressAnonymizer() {
    }

    public static String anonymize(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }

        String ipv4 = anonymizeIpv4(address);
        if (ipv4 != null) {
            return ipv4;
        }
        return anonymizeIpv6(address);
    }

    private static String anonymizeIpv4(String address) {
        String[] octets = address.split("\\.", -1);
        if (octets.length != 4) {
            return null;
        }
        for (String octet : octets) {
            try {
                int value = Integer.parseInt(octet);
                if (value < 0 || value > 255 || !Integer.toString(value).equals(octet)) {
                    return null;
                }
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return octets[0] + "." + octets[1] + "." + octets[2] + ".0/24";
    }

    private static String anonymizeIpv6(String address) {
        if (!address.contains(":")) {
            return null;
        }
        try {
            String withoutZone = address.contains("%") ? address.substring(0, address.indexOf('%')) : address;
            InetAddress parsed = InetAddress.getByName(withoutZone);
            if (!(parsed instanceof Inet6Address)) {
                return null;
            }
            byte[] bytes = parsed.getAddress();
            StringBuilder prefix = new StringBuilder();
            for (int i = 0; i < 8; i += 2) {
                if (i > 0) {
                    prefix.append(':');
                }
                prefix.append(Integer.toHexString((Byte.toUnsignedInt(bytes[i]) << 8)
                        | Byte.toUnsignedInt(bytes[i + 1])));
            }
            return prefix + "::/64";
        } catch (Exception ignored) {
            return null;
        }
    }
}
