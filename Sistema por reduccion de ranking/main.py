import pandas as pd
import sqlite3
from puntuacion import *
from competidor import *
from imprimir import *
from coleccion_competidores import *

nombre_mes = ["-", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre", "año"]

ano = 2025

print("conectando")

conexion = sqlite3.connect("WCA.db")

#En caso de cambiar los archivos de la db de la WCA, borrar el archivo anterior de la db y volver a correr db.py
#Actualización: Creo que no es necesario borrar el archivo viejo, con volver a correr db.py debería bastar

#El id de Uruguay es Uruguay

print("empezando")

#Obtener la colección de competidores
competidores = coleccion_competidores(conexion, ano)

consulta = f"SELECT id, year, month, day FROM Competitions WHERE countryId = 'Uruguay' AND year = {ano} AND month > 2;"
resultado = pd.read_sql_query(consulta, conexion)

# Guardar los datos en arrays
array_competencias = resultado.values.tolist()

# Mostrar el resultado
print(resultado)

for competencia in array_competencias:
    resultados_competencia, lista_competidores = agrupar_resultados_por_categoria(competencia[0], conexion)
    for competidor in lista_competidores:
        competidores[competidor].agregar_competencia(competencia[0], competencia[2]) #ID compe, mes
    for evento, resultados in resultados_competencia.items():
        puntuacion_competidor_posicion(resultados)
        for resultado in resultados:
            competidores[resultado[1]].agregar_resultado_competencia(competencia[0], resultado[5], resultado[3])
            #ID compe, puntuación competidor


for mes in range(1, 13):
    for jornada in range(1,10):
        try:
            resultados_competencia, lista_competidores = agrupar_resultados_por_categoria_no_oficial(jornada,mes, ano)
            for competidor in lista_competidores:
                competidores[competidor].agregar_competencia(f"Jornada liga {jornada} {nombre_mes[mes]}", mes)
            for evento, resultados in resultados_competencia.items():
                puntuacion_competidor_posicion(resultados)
                for resultado in resultados:
                    competidores[resultado[1]].agregar_resultado_competencia(f"Jornada liga {jornada} {nombre_mes[mes]}", resultado[5], resultado[3]) 
                    #esto hay que cambiarlo
        except Exception as e:
            print(e)

imprimir(competidores)


conexion.close() 