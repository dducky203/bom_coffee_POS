package com.bomcoffee.pos.tts;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tts")
@RequiredArgsConstructor
public class TtsController {

    private final GoogleTtsService googleTtsService;

    @GetMapping
    public ResponseEntity<byte[]> speak(@RequestParam String text) {
        byte[] audio = googleTtsService.synthesize(text);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("audio/mpeg"))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(audio);
    }
}
