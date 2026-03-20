package com.audioguide.mapper;


import com.audioguide.dto.audioDTO.AudioCreationRequest;
import com.audioguide.dto.audioDTO.AudioResponse;
import com.audioguide.entity.Audio;
import org.mapstruct.*;


@Mapper(componentModel = "spring")
public interface AudioMapper {

    @Mapping(target = "audioName", ignore = true)
    Audio toAudioFromAudioCreationRequest(AudioCreationRequest request);

    AudioResponse toAudioResponseFromAudio(Audio audio);

}