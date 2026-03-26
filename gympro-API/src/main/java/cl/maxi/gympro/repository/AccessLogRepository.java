package cl.maxi.gympro.repository;

import cl.maxi.gympro.model.AccessLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccessLogRepository extends MongoRepository<AccessLog, String> {
    
    // Permite contar los accesos filtrados por rol y rango de fechas
    long countByRoleAndTimestampBetween(String role, LocalDateTime start, LocalDateTime end);
    
    // Obtener las entradas de log en un rango (por si se requieren listar más adelante)
    List<AccessLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
