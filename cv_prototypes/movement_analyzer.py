import math

class MovementAnalyzer:
    def __init__(self):
        self.estado = "INICIO"
        self.contador_reps = 0
        self.alerta_postura = False
        
        self.ANGULO_PERTO = 80
        self.ANGULO_AFASTADO = 81
        self.ANGULO_ALERTA = 140

    def calcular_angulo(self, p1, p2, p3):
        a = math.sqrt(sum((p2[i] - p1[i])**2 for i in range(len(p1))))
        b = math.sqrt(sum((p3[i] - p2[i])**2 for i in range(len(p2))))
        c = math.sqrt(sum((p3[i] - p1[i])**2 for i in range(len(p1))))
        
        if a == 0 or b == 0:
            return 0.0

        cos_c = (a**2 + b**2 - c**2) / (2 * a * b)
        cos_c = max(min(cos_c, 1.0), -1.0)
        
        return math.degrees(math.acos(cos_c))

    def analyze(self, p_ombro, p_cotovelo, p_pulso, extra_data):
        angulo = self.calcular_angulo(p_ombro, p_cotovelo, p_pulso)

        self.alerta_postura = angulo > self.ANGULO_ALERTA

        if angulo < self.ANGULO_PERTO:
            if self.estado in ["PERFEITO", "LONGE"]:
                self.contador_reps += 1
            self.estado = "PERTO"
        
        elif self.ANGULO_AFASTADO <= angulo <= self.ANGULO_ALERTA:
            self.estado = "PERFEITO"
            
        elif angulo > self.ANGULO_ALERTA:
            self.estado = "LONGE"

        return angulo, self.estado, self.contador_reps, self.alerta_postura