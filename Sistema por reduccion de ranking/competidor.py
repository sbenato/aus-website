class Competidor:
    def __init__(self, wcaid, nombre):
        print(wcaid[0],"a")
        if wcaid[0] != 2 or wcaid[0] != 1:
            self.wcaid = "-"
        else:
            self.wcaid = wcaid
        self.nombre = nombre
        # Cambiar a un diccionario donde la clave es el mes y el valor es un conjunto de competencias
        self.meses = {mes: set() for mes in range(1, 13)}  # Diccionario con meses como claves y conjuntos como valores
        self.competencias = {}

    def agregar_competencia(self, id_competencia, mes):
        if mes in self.meses:  # Verificar que el mes sea válido
            self.meses[mes].add(id_competencia)  # Agregar la competencia al conjunto del mes
            self.competencias[id_competencia] = [0, 0, "", ""]  # Inicializar la competencia
            
    def agregar_resultado_competencia(self, id_competencia, resultado, cat):
        if resultado > self.competencias[id_competencia][0]:

            if self.competencias[id_competencia][0] != 0 and self.competencias[id_competencia][1] == 0:
                self.competencias[id_competencia][1] = self.competencias[id_competencia][0]
                self.competencias[id_competencia][3] = self.competencias[id_competencia][2]

            self.competencias[id_competencia][0] = resultado
            self.competencias[id_competencia][2] = cat
            
        elif resultado > self.competencias[id_competencia][1]:
            self.competencias[id_competencia][1] = resultado
            self.competencias[id_competencia][3] = cat
        
