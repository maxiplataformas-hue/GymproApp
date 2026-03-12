package cl.maxi.gympro.service;

import cl.maxi.gympro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MongoKeepAliveService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Runs every 10 seconds to keep the MongoDB connection active.
     * This perform a lightweight query (counting users).
     */
    @Scheduled(fixedRate = 10000)
    public void keepAlive() {
        try {
            long count = userRepository.count();
            // System.out.println("[Keep-Alive] MongoDB ping successful. User count: " + count);
        } catch (Exception e) {
            System.err.println("[Keep-Alive] Error pinging MongoDB: " + e.getMessage());
        }
    }
}
