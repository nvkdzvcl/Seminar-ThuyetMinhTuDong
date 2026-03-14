package com.audioguide.dto.apiDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PagingDto<T> {
    List<T> items;
    Long totalItems;
    int currentPage;
    int pageSize;
    Integer totalPages;
}
