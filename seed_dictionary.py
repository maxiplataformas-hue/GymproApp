"""
Seed script for Sports Dictionary - GymPro App
Run: python seed_dictionary.py
"""
import requests

API_URL = "http://localhost:8080/api/dictionary"

concepts = [
    # === ENTRENAMIENTO ===
    {"term": "1RM (Repetición Máxima)", "definition": "El peso máximo que una persona puede levantar una sola vez en un ejercicio determinado con técnica correcta. Se usa como referencia para calcular las cargas de entrenamiento.", "category": "Entrenamiento"},
    {"term": "Hipertrofia Muscular", "definition": "Aumento del tamaño de las fibras musculares como respuesta al entrenamiento de resistencia. Se clasifica en hipertrofia miofibrilar (fuerza) y sarcoplásmica (volumen).", "category": "Entrenamiento"},
    {"term": "Periodización", "definition": "Planificación sistemática del entrenamiento en ciclos (mesociclos, microciclos) para maximizar el rendimiento y prevenir el sobreentrenamiento.", "category": "Entrenamiento"},
    {"term": "Sobrecarga Progresiva", "definition": "Principio fundamental del entrenamiento: aumentar gradualmente el estrés (peso, volumen, frecuencia) para continuar generando adaptaciones.", "category": "Entrenamiento"},
    {"term": "Volumen de Entrenamiento", "definition": "Cantidad total de trabajo realizado en una sesión o semana, calculado como: series × repeticiones × peso.", "category": "Entrenamiento"},
    {"term": "Intensidad", "definition": "Porcentaje de la carga respecto al 1RM utilizado en un ejercicio. Una intensidad alta implica pesos cercanos al máximo.", "category": "Entrenamiento"},
    {"term": "Frecuencia de Entrenamiento", "definition": "Número de veces por semana que se entrena un grupo muscular o se realiza una sesión determinada.", "category": "Entrenamiento"},
    {"term": "Densidad de Entrenamiento", "definition": "Relación entre el tiempo de trabajo y el tiempo de descanso dentro de una sesión de entrenamiento.", "category": "Entrenamiento"},
    {"term": "Fallo Muscular", "definition": "Punto de una serie en el que no es posible completar otra repetición con técnica correcta. Alcanzar el fallo aumenta el estímulo, pero también el tiempo de recuperación.", "category": "Entrenamiento"},
    {"term": "Series de Calentamiento", "definition": "Series realizadas antes de los sets de trabajo principales, con carga progresiva menor, para activar el sistema nervioso y preparar los músculos.", "category": "Entrenamiento"},
    {"term": "Deload", "definition": "Semana de descarga en la que se reduce el volumen o la intensidad entre el 40-60% para permitir la recuperación completa y prevenir el agotamiento.", "category": "Entrenamiento"},
    {"term": "Superserie", "definition": "Técnica en la que se realizan dos ejercicios consecutivos sin descanso entre ellos. Puede ser agonista-antagonista o para diferentes grupos musculares.", "category": "Entrenamiento"},
    {"term": "Drop Set", "definition": "Técnica de intensidad donde al llegar al fallo se reduce el peso inmediatamente y se continúa con más repeticiones, sin descanso.", "category": "Entrenamiento"},
    {"term": "Tiempo Bajo Tensión (TUT)", "definition": "Duración total en segundos que un músculo permanece bajo carga durante una serie. Mayor TUT puede aumentar el estímulo de hipertrofia.", "category": "Entrenamiento"},
    {"term": "RIR (Reps in Reserve)", "definition": "Repeticiones en reserva: cuántas repeticiones adicionales podrías haber realizado antes de llegar al fallo. Usado para regular la intensidad real.", "category": "Entrenamiento"},
    {"term": "RPE (Rate of Perceived Exertion)", "definition": "Escala subjetiva de esfuerzo percibido del 1 al 10 (o 6 al 20 de Borg). Un RPE de 9 equivale a 1 RIR.", "category": "Entrenamiento"},
    {"term": "Rango de Movimiento (ROM)", "definition": "Amplitud articular de un ejercicio. Rangos completos de movimiento maximizan el estímulo muscular y la flexibilidad.", "category": "Entrenamiento"},
    {"term": "HIIT (High-Intensity Interval Training)", "definition": "Método cardiovascular que alterna intervalos de alta intensidad con periodos de recuperación activa o pasiva. Muy eficiente en tiempo.", "category": "Entrenamiento"},
    {"term": "LISS (Low-Intensity Steady State)", "definition": "Cardio de baja intensidad y larga duración (trotar, caminar). Favorece la oxidación de grasas y la recuperación activa.", "category": "Entrenamiento"},
    {"term": "Entrenamiento Concurrente", "definition": "Combinación de entrenamiento de fuerza y cardio en la misma sesión o en el mismo período. Puede interferir con la hipertrofia si no se programa correctamente.", "category": "Entrenamiento"},
    {"term": "Resistencia Muscular", "definition": "Capacidad del músculo para realizar esfuerzos repetidos durante un tiempo prolongado sin fatiga excesiva.", "category": "Entrenamiento"},
    {"term": "Potencia", "definition": "Capacidad de generar fuerza en el menor tiempo posible. Combinación de fuerza y velocidad. Fundamental en deportes explosivos.", "category": "Entrenamiento"},
    {"term": "Pliometría", "definition": "Ejercicios de salto y explosividad que aprovechan el ciclo de estiramiento-acortamiento muscular para desarrollar potencia.", "category": "Entrenamiento"},
    {"term": "Mesociclo", "definition": "Bloque de entrenamiento de 3-8 semanas con un objetivo específico (acumulación, intensificación, pico de rendimiento).", "category": "Entrenamiento"},
    {"term": "Microciclo", "definition": "Unidad mínima de planificación del entrenamiento, generalmente de 7 días. Organiza las sesiones de la semana.", "category": "Entrenamiento"},
    # === NUTRICIÓN ===
    {"term": "Macronutrientes", "definition": "Proteínas, carbohidratos y grasas: los tres nutrientes que aportan la mayor parte de energía al organismo.", "category": "Nutrición"},
    {"term": "Micronutrientes", "definition": "Vitaminas y minerales necesarios en pequeñas cantidades pero esenciales para procesos metabólicos, inmunológicos y estructurales.", "category": "Nutrición"},
    {"term": "Calorías (kcal)", "definition": "Unidad de medida de la energía aportada por los alimentos. 1 kcal = 4,18 kJ. Los macros aportan: proteína 4 kcal/g, CHO 4 kcal/g, grasa 9 kcal/g.", "category": "Nutrición"},
    {"term": "Déficit Calórico", "definition": "Consumir menos calorías de las que el organismo gasta. Condición necesaria para la pérdida de grasa corporal.", "category": "Nutrición"},
    {"term": "Superávit Calórico", "definition": "Consumir más calorías de las que el organismo gasta. Necesario para el aumento de masa muscular.", "category": "Nutrición"},
    {"term": "TDEE (Total Daily Energy Expenditure)", "definition": "Gasto energético total diario. Suma del metabolismo basal, termogénesis de los alimentos y actividad física.", "category": "Nutrición"},
    {"term": "TMB / BMR (Metabolismo Basal)", "definition": "Energía mínima que necesita el organismo para mantener sus funciones vitales en reposo absoluto.", "category": "Nutrición"},
    {"term": "Proteína Completa", "definition": "Proteína que contiene todos los aminoácidos esenciales en cantidades adecuadas. Fuentes: carnes, huevos, lácteos, soja.", "category": "Nutrición"},
    {"term": "BCAAs (Aminoácidos Ramificados)", "definition": "Leucina, Isoleucina y Valina. Aminoácidos esenciales clave en la síntesis proteica muscular, especialmente la leucina.", "category": "Nutrición"},
    {"term": "Ventana Anabólica", "definition": "Período post-ejercicio donde el cuerpo es más eficiente en absorber nutrientes para la recuperación. Actualmente se sabe que es más amplia de lo que se creía (2-4 h).", "category": "Nutrición"},
    {"term": "Glucógeno Muscular", "definition": "Reserva de carbohidratos almacenada en los músculos. Principal combustible para ejercicios de alta intensidad.", "category": "Nutrición"},
    {"term": "Índice Glucémico (IG)", "definition": "Medida que indica la rapidez con que un alimento eleva la glucosa en sangre. Alimentos de IG alto dan energía rápida; los de IG bajo, sostenida.", "category": "Nutrición"},
    {"term": "Carbohidratos Simples", "definition": "Azúcares de rápida absorción (fructosa, glucosa, sacarosa). Útiles para energía inmediata pre/post-entrenamiento.", "category": "Nutrición"},
    {"term": "Carbohidratos Complejos", "definition": "Polisacáridos de digestión lenta (avena, arroz integral, legumbres). Proveen energía sostenida y favorecen la saciedad.", "category": "Nutrición"},
    {"term": "Grasas Saturadas", "definition": "Grasas presentes en productos de origen animal. En exceso aumentan el LDL. Esenciales en cantidades moderadas para la producción hormonal.", "category": "Nutrición"},
    {"term": "Grasas Insaturadas", "definition": "Grasas beneficiosas (aguacate, aceite de oliva, pescado). Incluyen monoinsaturadas y poliinsaturadas (omega-3, omega-6).", "category": "Nutrición"},
    {"term": "Omega-3", "definition": "Ácido graso poliinsaturado esencial (EPA y DHA). Anti-inflamatorio, cardioprotector y beneficioso para la función cognitiva. Fuentes: salmón, sardinas, linaza.", "category": "Nutrición"},
    {"term": "Timing Nutricional", "definition": "Estrategia de distribuir la ingesta de nutrientes (especialmente proteínas y carbohidratos) en momentos clave del día según el entrenamiento.", "category": "Nutrición"},
    {"term": "Carbarhidrato Loading", "definition": "Protocolo de sobrecargar las reservas de glucógeno antes de una competencia mediante alta ingesta de carbohidratos en los días previos.", "category": "Nutrición"},
    {"term": "Ayuno Intermitente", "definition": "Patrón alimenticio que alterna periodos de ayuno con periodos de ingesta (ej: 16/8 o 5:2). Puede ayudar en la composición corporal.", "category": "Nutrición"},
    {"term": "Fibra Dietética", "definition": "Carbohidratos no digeribles que regulan el tránsito intestinal, mejoran la microbiota y contribuyen a la saciedad.", "category": "Nutrición"},
    {"term": "Síntesis de Proteínas Musculares (SMP)", "definition": "Proceso metabólico de construcción de nuevas proteínas musculares. Estimulado por el ejercicio de fuerza y la ingesta adecuada de proteínas.", "category": "Nutrición"},
    # === FISIOLOGÍA ===
    {"term": "VO2 Máx", "definition": "Consumo máximo de oxígeno: indicador de la capacidad aeróbica máxima. A mayor VO2 Max, mayor capacidad de resistencia.", "category": "Fisiología"},
    {"term": "Umbral Láctico", "definition": "Intensidad de ejercicio en la que el lactato en sangre empieza a acumularse más rápido de lo que puede ser eliminado. Entrenarlo mejora la resistencia.", "category": "Fisiología"},
    {"term": "EPOC (Exceso de Consumo de Oxígeno post-Ejercicio)", "definition": "Fenómeno donde el metabolismo se mantiene elevado después del ejercicio intenso, quemando más calorías durante horas.", "category": "Fisiología"},
    {"term": "Fibras Musculares Tipo I", "definition": "Fibras de contracción lenta, muy resistentes a la fatiga. Predominan en actividades aeróbicas de larga duración.", "category": "Fisiología"},
    {"term": "Fibras Musculares Tipo II", "definition": "Fibras de contracción rápida, potentes pero que se fatigan rápidamente. Claves para el deporte explosivo y la hipertrofia.", "category": "Fisiología"},
    {"term": "Frecuencia Cardíaca Máxima (FCM)", "definition": "Número máximo de latidos por minuto que puede alcanzar el corazón. Estimación: FCM = 220 - edad.", "category": "Fisiología"},
    {"term": "Zona de Entrenamiento Cardíaco", "definition": "Rangos de % de la FCM para distintos objetivos (Z1: recuperación activa / Z2: oxidación de grasas / Z3-Z5: rendimiento).", "category": "Fisiología"},
    {"term": "Cortisol", "definition": "Hormona catabólica del estrés secretada por las glándulas suprarrenales. En exceso inhibe la síntesis proteica y promueve la acumulación de grasa.", "category": "Fisiología"},
    {"term": "Testosterona", "definition": "Hormona anabólica principal en hombres. Favorece el crecimiento muscular, la densidad ósea y la recuperación. El ejercicio de fuerza la estimula.", "category": "Fisiología"},
    {"term": "Hormona de Crecimiento (GH)", "definition": "Hormona anabólica secretada durante el sueño profundo (fase 3) y el ejercicio intenso. Favorece la lipolisis y la síntesis proteica.", "category": "Fisiología"},
    {"term": "Insulina", "definition": "Hormona pancreática que regula la glucosa en sangre y favorece el almacenamiento de nutrientes en células musculares y adiposas.", "category": "Fisiología"},
    {"term": "Sistema Nervioso Autónomo", "definition": "Sistema que regula las funciones involuntarias: simpático (activación, estrés) y parasimpático (recuperación, reposo).", "category": "Fisiología"},
    {"term": "Síndrome de Sobreentrenamiento", "definition": "Estado de fatiga crónica causado por falta de recuperación adecuada. Síntomas: caída del rendimiento, irritabilidad, insomnio, lesiones recurrentes.", "category": "Fisiología"},
    {"term": "Adaptación Fisiológica", "definition": "Cambios estructurales y funcionales que ocurren en el cuerpo como respuesta a los estímulos del entrenamiento para mejorar su rendimiento.", "category": "Fisiología"},
    {"term": "Lípidos", "definition": "Grasas y aceites que forman parte de membranas celulares, hormonas y son fuente energética en ejercicios de baja intensidad.", "category": "Fisiología"},
    {"term": "Hidratación", "definition": "Estado de equilibrio hídrico corporal. Una pérdida del 2% de peso en líquidos ya reduce el rendimiento deportivo significativamente.", "category": "Fisiología"},
    {"term": "Gluconeogénesis", "definition": "Proceso metabólico por el cual el hígado sintetiza glucosa a partir de sustratos no glucídicos (aminoácidos, glicerol, lactato).", "category": "Fisiología"},
    # === SUPLEMENTACIÓN ===
    {"term": "Creatina Monohidrato", "definition": "El suplemento deportivo más estudiado y respaldado científicamente. Aumenta los depósitos de fosfocreatina muscular, mejorando la potencia y la recuperación.", "category": "Suplementación"},
    {"term": "Whey Protein (Proteína de Suero)", "definition": "Proteína derivada del suero de la leche. Alto valor biológico y rápida absorción, ideal para el período post-entrenamiento.", "category": "Suplementación"},
    {"term": "Caseína", "definition": "Proteína láctea de digestión lenta. Ideal para tomar antes de dormir, ya que libera aminoácidos de forma sostenida durante horas.", "category": "Suplementación"},
    {"term": "Cafeína", "definition": "Estimulante del SNC que reduce la percepción del esfuerzo y la fatiga. Dosis efectiva: 3-6 mg/kg de peso corporal, 60 min antes del ejercicio.", "category": "Suplementación"},
    {"term": "Beta-Alanina", "definition": "Aminoácido que aumenta la carnosina muscular, retrasando la acidez muscular. Efectiva para esfuerzos de 1-4 minutos. Produce sensación de hormigueo.", "category": "Suplementación"},
    {"term": "Glutamina", "definition": "Aminoácido abundante en el músculo. Puede apoyar la recuperación y la función inmune, especialmente en etapas de alto volumen de entrenamiento.", "category": "Suplementación"},
    {"term": "Vitamina D3", "definition": "Vitaminas esencial para la absorción de calcio, función inmune y producción hormonal. Deficiencia común en personas con poca exposición solar.", "category": "Suplementación"},
    {"term": "Magnesio", "definition": "Mineral clave en más de 300 reacciones enzimáticas. Apoya la función muscular, el sueño y la sensibilidad a la insulina. Común su déficit en deportistas.", "category": "Suplementación"},
    {"term": "Pre-Workout", "definition": "Combinación de ingredientes (cafeína, beta-alanina, citrulina, etc.) para mejorar el rendimiento y la concentración antes del entrenamiento.", "category": "Suplementación"},
    {"term": "Citrulina Malato", "definition": "Aminoácido que mejora el flujo sanguíneo, reduce la fatiga muscular y pode potenciar el rendimiento en ejercicios de alta repetición.", "category": "Suplementación"},
    {"term": "HMB (Beta-Hidroxi-Beta-Metilbutirato)", "definition": "Metabolito de la leucina que puede reducir el catabolismo muscular. Útil en períodos de déficit calórico o alta carga de entrenamiento.", "category": "Suplementación"},
    {"term": "ZMA", "definition": "Combinación de Zinc, Magnesio y vitamina B6. Puede mejorar la calidad del sueño y apoyar los niveles de testosterona en personas con deficiencia.", "category": "Suplementación"},
    # === RECUPERACIÓN ===
    {"term": "Recuperación Activa", "definition": "Actividad de baja intensidad (caminar, nadar suave) realizada entre sesiones para mejorar la circulación y la eliminación de desechos metabólicos.", "category": "Recuperación"},
    {"term": "Foam Rolling (Liberación Miofascial)", "definition": "Técnica de auto-masaje utilizando un rodillo de espuma para reducir la rigidez muscular, mejorar la movilidad y acelerar la recuperación.", "category": "Recuperación"},
    {"term": "Sueño y Recuperación", "definition": "El sueño profundo (fase 3-4) es el período del mayor pico de hormona de crecimiento. 7-9 horas de sueño son esenciales para la recuperación óptima.", "category": "Recuperación"},
    {"term": "DOMS (Dolor Muscular de Aparición Tardía)", "definition": "Dolor o rigidez muscular que aparece 24-72 horas después de un ejercicio intenso o nuevo. Causado por microdesgarros de fibras musculares.", "category": "Recuperación"},
    {"term": "Crioterapia", "definition": "Uso del frío (baños de hielo, duchas frías, cámaras de frío) para reducir la inflamación y accelerar la recuperación muscular.", "category": "Recuperación"},
    {"term": "Termoterapia", "definition": "Uso del calor (saunas, baños calientes) para relajar la musculatura, mejorar la circulación y acelerar la recuperación.", "category": "Recuperación"},
    {"term": "Variabilidad de la Frecuencia Cardíaca (HRV)", "definition": "Indicador del estado del sistema nervioso autónomo. Una HRV alta indica buena recuperación; baja HRV sugiere fatiga acumulada o estrés.", "category": "Recuperación"},
    {"term": "Periodización de la Recuperación", "definition": "Planificación estratégica de semanas o ciclos de menor intensidad (deload) dentro del plan de entrenamiento para permitir la supercompensación.", "category": "Recuperación"},
    # === MÉTRICAS ===
    {"term": "IMC (Índice de Masa Corporal)", "definition": "Relación entre el peso y la estatura al cuadrado (kg/m²). Orientativo para clasificar el estado de peso, aunque no distingue músculo de grasa.", "category": "Métricas"},
    {"term": "IGC (Índice de Grasa Corporal)", "definition": "Porcentaje del peso corporal compuesto por tejido adiposo. Medido con calipers, DEXA, bioimpedancia o ecografía.", "category": "Métricas"},
    {"term": "Masa Libre de Grasa (FFM)", "definition": "Componente del peso corporal que no es tejido graso: músculo, huesos, agua, órganos. Aumentar la FFM es el objetivo principal del entrenamiento de fuerza.", "category": "Métricas"},
    {"term": "IMC de Grasa Visceral", "definition": "Nivel de grasa almacenada alrededor de los órganos internos. Más peligrosa que la grasa subcutánea. Medida por bioimpedancia o DEXA.", "category": "Métricas"},
    {"term": "Relación Cintura-Cadera (WHR)", "definition": "Indicador de distribución de la grasa corporal. Una ratio > 0.9 (hombres) o > 0.85 (mujeres) se asocia con mayor riesgo metabólico.", "category": "Métricas"},
    {"term": "Protocolo de Jackson-Pollock", "definition": "Método de estimación de grasa corporal mediante 3 o 7 pliegues cutáneos medidos con caliper. Muy usado en evaluaciones deportivas.", "category": "Métricas"},
    {"term": "DEXA (Absorciometría de rayos X de doble energía)", "definition": "Estudio de imagen que mide con alta precisión la composición corporal: masa ósea, músculo y grasa. Considerado el estándar de oro.", "category": "Métricas"},
    {"term": "Bioimpedancia Eléctrica", "definition": "Método para estimar la composición corporal mediante la resistencia del cuerpo al paso de una corriente eléctrica. Rápido aunque menos preciso que DEXA.", "category": "Métricas"},
    {"term": "Caliper Adipómetro", "definition": "Instrumento manual que mide el grosor de los pliegues cutáneos para estimar el porcentaje de grasa corporal.", "category": "Métricas"},
    {"term": "Circunferencia Muscular", "definition": "Medición con cinta métrica del perímetro de grupos musculares (bícep, pecho, muslo). Útil para monitorear el progreso de hipertrofia.", "category": "Métricas"},
]

seeded = 0
errors = 0
for concept in concepts:
    payload = {**concept, "coachEmail": "sistema"}
    r = requests.post(API_URL, json=payload, verify=False)
    if r.status_code == 200:
        seeded += 1
        print(f"✓ {concept['term']}")
    else:
        errors += 1
        print(f"✗ {concept['term']} → {r.status_code} {r.text}")

print(f"\n✅ {seeded} conceptos sembrados | ❌ {errors} errores")
