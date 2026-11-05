import pandas as pd
from itertools import groupby
import csv

def agrupar_resultados_por_categoria(competencia, conexion):
    consulta = f"WITH RankedResults AS (SELECT pos, personId, personName, eventId, roundTypeId, ROW_NUMBER() OVER (PARTITION BY personId, eventId ORDER BY pos) AS rn FROM Results WHERE competitionId = '{competencia}') SELECT pos, personId, personName, eventId, roundTypeId FROM RankedResults WHERE rn = 1;"
    
    resultado = pd.read_sql_query(consulta, conexion)

    array_resultados = resultado.values.tolist()

    lista_eventos = {}
    for item in array_resultados:
        key = item[3]  # Obtener el evento
        if key not in lista_eventos:
            lista_eventos[key] = []  # Crear una lista vacía si el evento no se incluyó
        lista_eventos[key].append(item)  # Agregar el evento a la lista correspondiente

    lista_competidores = {key: list(group) for key, group in groupby(array_resultados, key=lambda x: x[1])}

    return lista_eventos, lista_competidores

def agrupar_resultados_por_categoria_no_oficial(jornada, mes, anio):
    nombre_archivo = f"no_oficiales/{anio}_{mes}_{jornada}.csv"
    try:
        with open(nombre_archivo, 'r', newline='', encoding='utf-8') as archivo_csv:
            lector_csv = csv.reader(archivo_csv)
            array_resultados = []

            #Armar los resultados como lo hace la otra función
            cabecera = True
            lista_eventos = {}
            for fila in lector_csv:
                if cabecera:
                    cabecera = False
                else:  
                    key = fila[0] #obtengo el evento
                    fila[1] = int(fila[1])
                    if key not in lista_eventos:
                        lista_eventos[key] = []
                    lista_eventos[key].append(fila)
                    array_resultados.append(fila)
            
            for nombre_evento in lista_eventos:
                evento = lista_eventos[nombre_evento]
                evento = sorted(evento, key=lambda fila: fila[1]) #ordeno para que sea más fácil ver el tema de empates
                #Hora del desempate de la WCA

                for i in range(1, len(evento)): #Se toma desde 1 para evitar desbordes
                    if evento[i][9] == evento[i-1][9]:
                        #Se ponen los tiempos de cada participante en una lista
                        tiempos2 = sorted([evento[i][4],evento[i][5],evento[i][6],evento[i][7],evento[i][8]])
                        tiempos1 = sorted([evento[i-1][4],evento[i-1][5],evento[i-1][6],evento[i-1][7],evento[i-1][8]])
                        se_dio_la_casualidad_mas_grande_del_mundo = True

                        #Se ve quién hizo el tiempo más bajo
                        for j in range(len(tiempos1)): #Podría ser también tiempos 2
                            if tiempos1[j] < tiempos2[j]:
                                se_dio_la_casualidad_mas_grande_del_mundo = False
                                break
                            if tiempos1[j] > tiempos2[j]:
                                evento[i], evento[i-1] = evento[i-1], evento[i]
                                evento[i][1], evento[i-1][1] = evento[i-1][1], evento[i][1] 
                                se_dio_la_casualidad_mas_grande_del_mundo = False
                                break
                        
                        #Todos los tiempos son iguales
                        if se_dio_la_casualidad_mas_grande_del_mundo:
                            evento[i][1] = evento[i-1][1]

                lista_eventos[nombre_evento] = []
                for i in range(len(evento)): #Ahora los parseo como tengo el de la base de datos
                    #posición, WCAID, nombre, categoría, ronda (seguramente sea siempre 1)
                    aux_linea = [evento[i][1], evento[i][2], evento[i][3], evento[i][0], "f"]
                    lista_eventos[nombre_evento].append(aux_linea)

        lista_competidores = {key: list(group) for key, group in groupby(array_resultados, key=lambda x: x[2])}
        return lista_eventos, lista_competidores
                    
    except FileNotFoundError:
        print(f"Error: No se pudo encontrar el archivo '{nombre_archivo}'.")
    return

def puntuacion_competidor_posicion(resultados):
    maximo = 0
    for resultado in resultados:
        if int(resultado[0]) > maximo:
            maximo = int(resultado[0])
    
    for resultado in resultados:
        puntuacion = maximo - int(resultado[0])

        if puntuacion < maximo/2:
            puntuacion = maximo/2
        
        resultado.append(puntuacion)





