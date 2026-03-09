package cl.maxi.gympro.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document(collection = "otp_codes")
public class OtpCode {

    @Id
    private String id;

    private String email;
    private String code;
    private Instant expiresAt;
    private boolean used;

    public OtpCode(String email, String code) {
        this.email = email;
        this.code = code;
        this.expiresAt = Instant.now().plusSeconds(600); // 10 minutes
        this.used = false;
    }
}
