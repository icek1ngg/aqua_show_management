package com.asms.identity.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class IpAddressAnonymizerTest {

    @Test
    void anonymize_shouldMaskIpv4ToSlash24() {
        assertEquals("192.168.12.0/24", IpAddressAnonymizer.anonymize("192.168.12.99"));
    }

    @Test
    void anonymize_shouldMaskIpv6ToSlash64() {
        assertEquals("2001:db8:abcd:12::/64", IpAddressAnonymizer.anonymize("2001:db8:abcd:12:1234:5678:9abc:def0"));
    }

    @Test
    void anonymize_shouldNotPersistInvalidAddress() {
        assertNull(IpAddressAnonymizer.anonymize("client.example.com"));
        assertNull(IpAddressAnonymizer.anonymize(null));
    }
}
