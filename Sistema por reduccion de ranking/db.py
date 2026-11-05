import pandas as pd
import sqlite3

conexion = sqlite3.connect("WCA.db")

championships_tsv = "WCA_export_tsv/WCA_export_championships.tsv"
championships = pd.read_csv(championships_tsv, delimiter="\t")
championships.to_sql("championships", conexion, index=False, if_exists="replace")

Competitions_tsv = "WCA_export_tsv/WCA_export_Competitions.tsv"
Competitions = pd.read_csv(Competitions_tsv, delimiter="\t")
Competitions.to_sql("Competitions", conexion, index=False, if_exists="replace")

Continents_tsv = "WCA_export_tsv/WCA_export_Continents.tsv"
Continents = pd.read_csv(Continents_tsv, delimiter="\t")
Continents.to_sql("Continents", conexion, index=False, if_exists="replace")

Countries_tsv = "WCA_export_tsv/WCA_export_Countries.tsv"
Countries = pd.read_csv(Countries_tsv, delimiter="\t")
Countries.to_sql("Countries", conexion, index=False, if_exists="replace")

Events_tsv = "WCA_export_tsv/WCA_export_Events.tsv"
Events = pd.read_csv(Events_tsv, delimiter="\t")
Events.to_sql("Events", conexion, index=False, if_exists="replace")

Formats_tsv = "WCA_export_tsv/WCA_export_Formats.tsv"
Formats = pd.read_csv(Formats_tsv, delimiter="\t")
Formats.to_sql("Formats", conexion, index=False, if_exists="replace")

Persons_tsv = "WCA_export_tsv/WCA_export_Persons.tsv"
Persons = pd.read_csv(Persons_tsv, delimiter="\t")
Persons.to_sql("Persons", conexion, index=False, if_exists="replace")

RanksAverage_tsv = "WCA_export_tsv/WCA_export_RanksAverage.tsv"
RanksAverage = pd.read_csv(RanksAverage_tsv, delimiter="\t")
RanksAverage.to_sql("RanksAverage", conexion, index=False, if_exists="replace")

RanksSingle_tsv = "WCA_export_tsv/WCA_export_RanksSingle.tsv"
RanksSingle = pd.read_csv(RanksSingle_tsv, delimiter="\t")
RanksSingle.to_sql("RanksSingle", conexion, index=False, if_exists="replace")

Results_tsv = "WCA_export_tsv/WCA_export_Results.tsv"
Results = pd.read_csv(Results_tsv, delimiter="\t")
Results.to_sql("Results", conexion, index=False, if_exists="replace")

RoundTypes_tsv = "WCA_export_tsv/WCA_export_RoundTypes.tsv"
RoundTypes = pd.read_csv(RoundTypes_tsv, delimiter="\t")
RoundTypes.to_sql("RoundTypes", conexion, index=False, if_exists="replace")

Scrambles_tsv = "WCA_export_tsv/WCA_export_Scrambles.tsv"
Scrambles = pd.read_csv(Scrambles_tsv, delimiter="\t")
Scrambles.to_sql("Scrambles", conexion, index=False, if_exists="replace")

# Cerrar conexión
conexion.close()
