package com.audioguide.repository;

import com.audioguide.entity.PoiMenuItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PoiMenuItemRepository extends JpaRepository<PoiMenuItem, Integer> {
    List<PoiMenuItem> findByPoi_IdOrderByCreatedAtDesc(Integer poiId);
    Optional<PoiMenuItem> findFirstByPoi_IdAndNameOrderByUpdatedAtDesc(Integer poiId, String name);
}
