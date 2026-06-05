package com.asms.catalog.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Service
public class CatalogCacheService {

    private final StringRedisTemplate redisTemplate;

    public CatalogCacheService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void invalidateShowCache(UUID showId) {
        delete("show:list");
        if (showId != null) {
            delete("show:detail:" + showId);
            delete("schedule:show:" + showId);
        }
    }

    public void invalidateScheduleCache(UUID showId, UUID scheduleId) {
        invalidateShowCache(showId);
        if (scheduleId != null) {
            delete("schedule:" + scheduleId);
        }
    }

    private void delete(String key) {
        try {
            redisTemplate.delete(key);
            Set<String> wildcardKeys = redisTemplate.keys(key + ":*");
            if (wildcardKeys != null && !wildcardKeys.isEmpty()) {
                redisTemplate.delete(wildcardKeys);
            }
        } catch (RuntimeException ignored) {
            // Cache invalidation must not block PostgreSQL writes.
        }
    }
}
