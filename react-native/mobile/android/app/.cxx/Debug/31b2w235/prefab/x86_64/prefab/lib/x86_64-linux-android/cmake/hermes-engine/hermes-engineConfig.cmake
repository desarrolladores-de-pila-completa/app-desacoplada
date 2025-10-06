if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/diego/.gradle/caches/8.14.3/transforms/aae44064e5ebb5af022ad83ed0ca6e0a/transformed/hermes-android-0.81.4-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/diego/.gradle/caches/8.14.3/transforms/aae44064e5ebb5af022ad83ed0ca6e0a/transformed/hermes-android-0.81.4-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

