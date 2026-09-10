package com.bomcoffee.pos.tts;

import com.bomcoffee.pos.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class GoogleTtsService {

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public byte[] synthesize(String text) {
        String clean = text == null ? "" : text.replaceAll("\\s+", " ").trim();
        if (clean.isEmpty()) {
            throw new BusinessException("Chưa có nội dung để đọc", "TTS_EMPTY");
        }
        if (clean.length() > 180) {
            clean = clean.substring(0, 180).trim();
        }

        String encoded = URLEncoder.encode(clean, StandardCharsets.UTF_8);
        String url = "https://translate.google.com/translate_tts"
                + "?ie=UTF-8"
                + "&client=tw-ob"
                + "&tl=vi"
                + "&total=1"
                + "&idx=0"
                + "&textlen=" + clean.length()
                + "&q=" + encoded;

        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .header("User-Agent", USER_AGENT)
                .header("Referer", "https://translate.google.com/")
                .header("Accept", "audio/mpeg, audio/*;q=0.9, */*;q=0.8")
                .header("Accept-Language", "vi-VN,vi;q=0.9,en;q=0.8")
                .GET()
                .build();

        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            byte[] body = response.body();
            if (response.statusCode() != 200 || body == null || body.length < 100) {
                throw new BusinessException("Không lấy được giọng đọc tiếng Việt", "TTS_FAILED");
            }
            return body;
        } catch (BusinessException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BusinessException("Không lấy được giọng đọc tiếng Việt", "TTS_FAILED");
        } catch (IOException ex) {
            throw new BusinessException("Không lấy được giọng đọc tiếng Việt", "TTS_FAILED");
        }
    }
}
