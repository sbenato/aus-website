from competidor import *

def imprimir(set_competidores):
    nombre_mes = ["-", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre", "año"]
    print("Empezando a imprimir")
    meses = {mes: list() for mes in range(1, 14)}
    competidores = {}
    for id, competidor in set_competidores.items():
        
        
        #Si quiero que los mails no se muesren
        if id[0] != "2":
            id = "-"
        
        
        for mes, competencias in competidor.meses.items():
            puntuacion = 0
            for competencia in competencias:
                puntuacion += competidor.competencias[competencia][0] + competidor.competencias[competencia][1]
                print([puntuacion, id, competidor.nombre])

            if len(meses[mes]) == 0 and puntuacion != 0:
                meses[mes].append([puntuacion, id, competidor.nombre])
            elif puntuacion != 0:
                agregado = False
                for i in range(len(meses[mes])):
                    if puntuacion > meses[mes][i][0]:
                        meses[mes].insert(i, [puntuacion, id, competidor.nombre])
                        agregado = True
                        break
                
                if not agregado:
                    meses[mes].append([puntuacion, id, competidor.nombre])

            if competidor in competidores:
                competidores[competidor] += puntuacion
            else:
                competidores[competidor] = puntuacion

    for competidor in competidores:
        if len(meses[13]) == 0 and competidores[competidor] != 0:
            meses[13].append([competidores[competidor], competidor.wcaid, competidor.nombre])
        elif competidores[competidor] != 0:
            agregado = False
            for i in range(len(meses[13])):
                if competidores[competidor] > meses[13][i][0]:
                    meses[13].insert(i, [competidores[competidor], competidor.wcaid, competidor.nombre])
                    agregado = True
                    break
            
            if not agregado:
                meses[13].append([competidores[competidor], competidor.wcaid, competidor.nombre])

    for mes, tabla in meses.items():
        print(f"Tabla de {nombre_mes[mes]}")
        for i in range(len(tabla)):
            print(i+1, tabla[i])
        input()

