package com.audioguide.repository;

import com.audioguide.entity.Audio;
import com.audioguide.entity.Dish;
import com.audioguide.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AudioRepository extends JpaRepository<Audio, Integer> {

    boolean existsByDishIdAndLanguageId(Integer dishId, Integer languageId);


}