package com.audioguide.mapper;

import com.audioguide.dto.languageDTO.LanguageCreationRequest;
import com.audioguide.dto.languageDTO.LanguageResponse;
import com.audioguide.entity.Language;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LanguageMapper {

    Language toLanguageFromLanguageCreationRequest(LanguageCreationRequest request);

    LanguageResponse toLanguageResponseFromLanguage(Language language);
}
