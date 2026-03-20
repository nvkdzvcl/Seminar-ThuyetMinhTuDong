package com.audioguide.dto.audioDTO;


import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AudioCreationRequest {

    @NotNull(message = "AUDIO_DISH_ID_BLANK")
    Integer dishId;

    @NotNull(message = "AUDIO_FILE_BLANK")
    MultipartFile audioFile;

    @NotNull(message = "AUDIO_LANGUAGE_ID_BLANK")
    Integer languageId;


}
