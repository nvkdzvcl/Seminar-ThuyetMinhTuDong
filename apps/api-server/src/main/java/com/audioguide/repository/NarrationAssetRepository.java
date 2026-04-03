package com.audioguide.repository;

import com.audioguide.entity.NarrationAsset;
import com.audioguide.enums.NarrationEntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NarrationAssetRepository extends JpaRepository<NarrationAsset, Integer> {

    Optional<NarrationAsset> findFirstByEntityTypeAndEntityIdAndLanguageKeyIgnoreCase(
            NarrationEntityType entityType,
            Integer entityId,
            String languageKey
    );

    List<NarrationAsset> findByEntityTypeAndEntityIdOrderByLanguageKeyAsc(
            NarrationEntityType entityType,
            Integer entityId
    );
}

