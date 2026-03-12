package cl.maxi.gympro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GymproApplication {

	public static void main(String[] args) {
		SpringApplication.run(GymproApplication.class, args);
	}

}
