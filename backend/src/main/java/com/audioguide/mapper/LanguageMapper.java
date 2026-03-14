 package com.audioguide.mapper;

import com.audioguide.dto.dishDTO.DishCreationRequest;
import com.audioguide.dto.dishDTO.DishResponse;
import com.audioguide.dto.dishDTO.DishUpdateRequest;
import com.audioguide.dto.languageDTO.LanguageCreationRequest;
import com.audioguide.dto.languageDTO.LanguageResponse;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Language;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface LanguageMapper {

    Language toLanguageFromLanguageCreationRequest(LanguageCreationRequest request);

    LanguageResponse toLanguageResponseFromLanguage(Language language);
}