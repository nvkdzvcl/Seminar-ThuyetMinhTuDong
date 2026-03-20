package com.audioguide.service;

import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.languageDTO.LanguageCreationRequest;
import com.audioguide.dto.languageDTO.LanguageResponse;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.LanguageMapper;
import com.audioguide.repository.LanguageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LanguageService {

    LanguageMapper languageMapper;
    LanguageRepository languageRepository;

    public LanguageResponse createLanguage(LanguageCreationRequest request) {
        if(languageRepository.existsByCode(request.getCode())){
            log.error("Language with code {} already exists", request.getCode());
            throw new AppException(ErrorCode.LANGUAGE_CODE_EXISTS);
        }
        var languageEntity = languageMapper.toLanguageFromLanguageCreationRequest(request);
        var savedLanguage = languageRepository.save(languageEntity);
        log.info("Language with name {} created successfully", request.getLanguageName());
        return languageMapper.toLanguageResponseFromLanguage(savedLanguage);
    }


    public LanguageResponse getLanguageById(Integer id) {
        var language = languageRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_FOUND));
        return languageMapper.toLanguageResponseFromLanguage(language);
    }

    public PagingDto<LanguageResponse> getAllLanguages() {
        var languages = languageRepository.findAll();
        var languageResponses = languages.stream()
                .map(languageMapper::toLanguageResponseFromLanguage)
                .toList();
        return PagingDto.<LanguageResponse>builder()
                .items(languageResponses)
                .totalItems(Long.valueOf(languageResponses.size()))
                .totalPages(1)
                .currentPage(1)
                .build();
    }

}