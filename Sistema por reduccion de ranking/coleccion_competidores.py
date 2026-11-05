from competidor import *
import csv
import pandas as pd

def coleccion_competidores(conexion, ano):
    consulta = f"SELECT DISTINCT p.id, p.name FROM Persons p JOIN Results r ON p.id = r.personId JOIN Competitions c ON r.competitionId = c.id WHERE c.countryId = 'Uruguay' AND c.year = {ano};"
    resultado = pd.read_sql_query(consulta, conexion)

    print("Terminó consulta")

    # Guardar los datos de competidores en el array competidores
    competidores = resultado.values.tolist()
    aux = {}
    for competidor in competidores:
        c = Competidor(competidor[0], competidor[1]) #WCAID, nombre
        aux[competidor[0]] = c
    competidores = aux

    for mes in range(1, 13):
        for jornada in range(1, 10):
            nombre_archivo = f"no_oficiales/{ano}_{mes}_{jornada}.csv"
            try:
                with open(nombre_archivo, 'r', newline='', encoding='utf-8') as archivo_csv:
                    lector_csv = csv.reader(archivo_csv)
                    cabecera = True
                    for fila in lector_csv:
                        if cabecera:
                            cabecera = False
                        elif not (fila[2] in competidores): 
                            c = Competidor(fila[2], fila[3]) #ID, nombre
                            #ver después qué hacemos si alguien que no tenía WCA luego lo obtiene
                            competidores[fila[2]] = c
            except:
                hola = None

    return competidores