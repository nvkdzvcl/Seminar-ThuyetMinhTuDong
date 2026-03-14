package com.audioguide.service;


import com.audioguide.dto.audioDTO.AudioCreationRequest;
import com.audioguide.dto.audioDTO.AudioResponse;
import com.audioguide.entity.Audio;
import com.audioguide.entity.Dish;
import com.audioguide.entity.Language;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.AudioMapper;
import com.audioguide.repository.AudioRepository;
import com.audioguide.repository.DishRepository;
import com.audioguide.repository.LanguageRepository;
import com.audioguide.utils.FileStoreUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Path;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AudioService {

    AudioRepository audioRepository;
    AudioMapper audioMapper;
    DishRepository dishRepository;
    LanguageRepository languageRepository;

    Path AUDIO_DIR = Path.of("uploads/dish-audios");


    public AudioResponse createAudio(AudioCreationRequest request) {

        Dish dish = dishRepository.findById(request.getDishId())
                .orElseThrow(() -> new AppException(ErrorCode.DISH_NOT_FOUND));

        Language language = languageRepository.findById(request.getLanguageId())
                .orElseThrow(() -> new AppException(ErrorCode.LANGUAGE_NOT_FOUND));

        if(audioRepository.existsByDishIdAndLanguageId(request.getDishId(), request.getLanguageId())) {
            throw new AppException(ErrorCode.AUDIO_ALREADY_EXISTS);
        }

        Audio audio = audioMapper.toAudioFromAudioCreationRequest(request);

        audio.setDish(dish);
        audio.setLanguage(language);

        String audioName = FileStoreUtil.saveKeepingNameWithSuffix(request.getAudioFile(), AUDIO_DIR);
        audio.setAudioName(audioName);

        audio = audioRepository.save(audio);

        return audioMapper.toAudioResponseFromAudio(audio);
    }


}
