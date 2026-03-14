package com.audioguide.entity;


import com.audioguide.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "language")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Language {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    String languageName;

    @Column(unique = true)
    String code;


}
