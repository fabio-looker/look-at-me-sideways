view: accidents {
  sql_table_name: faa.accidents ;;

  parameter: param_dynamic_measure {
    type: unquoted
    allowed_value: {value: "d" label:"Deaths"}
    allowed_value: {value: "da" label:"Deaths & major injuries"}
    allowed_value: {value: "dai" label:"Deaths, major & minor injuries"}
  }

  dimension: chosen_dynamic_measure  {
    #hidden: yes
    sql:{% parameter param_dynamic_measure %};;
  }

  measure: dynamic_measure {
    label_from_parameter: param_dynamic_measure
    type: sum
    sql: -- Param value: {{accidents.chosen_dynamic_measure._sql}}
         {% if chosen_dynamic_measure._sql == "d" %} ${number_of_fatalities}
         {% elsif chosen_dynamic_measure._sql == "da" %} ${number_of_fatalities} + ${number_of_serious_injuries}
         {% elsif chosen_dynamic_measure._sql == "dai" %} ${number_of_fatalities} + ${number_of_serious_injuries} + ${number_of_minor_injuries}
         {% else %}  ${number_of_fatalities} + 0.5 * ${number_of_serious_injuries} + 0.1 * ${number_of_minor_injuries}
         {% endif %}
        ;;
  }

  dimension: accident_lookup_dim {
    sql: ${accident_number} || '<id ' || ${id} || '>' ;;
  }
  parameter: accident_lookup {
    suggest_dimension: accident_lookup_dim
  }

  dimension: accident_id {
    hidden: yes
    type: number
    sql: ${TABLE}.id ;;
  }

  dimension: id {
    type: number
    sql: ${TABLE}.id ;;
  }

  dimension: accident_number {
    type: string
    sql: ${TABLE}.accident_number ;;
  }

  dimension: air_carrier {
    type: string
    sql: ${TABLE}.air_carrier ;;
  }

  dimension: aircraft_category {
    type: string
    sql: ${TABLE}.aircraft_category ;;
  }

  dimension: aircraft_damage {
    type: string
    sql: ${TABLE}.aircraft_damage ;;
  }

  dimension: aircraft_id {
    type: string
    # hidden: yes
    sql: ${TABLE}.aircraft_id ;;
  }

  dimension: airport_code {
    type: string
    sql: ${TABLE}.airport_code ;;
  }

  dimension: airport_name {
    type: string
    sql: ${TABLE}.airport_name ;;
  }

  dimension: amateur_built {
    type: string
    sql: ${TABLE}.amateur_built ;;
  }

  dimension: broad_phase_of_flight {
    type: string
    sql: ${TABLE}.broad_phase_of_flight ;;
  }

  dimension: country {
    type: string
    map_layer_name: countries
    sql: ${TABLE}.country ;;
  }

  dimension: engine_type {
    type: string
    sql: ${TABLE}.engine_type ;;
  }

  dimension_group: event {
    type: time
    timeframes: [
      raw,
      time,
      date,
      week,
      month,
      quarter,
      year
    ]
    sql: ${TABLE}.event_date ;;
  }

  dimension: event_id {
    type: string
    sql: ${TABLE}.event_id ;;
  }

  dimension: far_description {
    type: string
    sql: ${TABLE}.far_description ;;
  }

  dimension: injury_severity {
    type: string
    sql: ${TABLE}.injury_severity ;;
  }

  dimension: investigation_type {
    type: string
    sql: ${TABLE}.investigation_type ;;
  }

  dimension: latitude {
    type: string
    sql: ${TABLE}.latitude ;;
  }

  dimension: location {
    type: string
    sql: ${TABLE}.location ;;
  }

  dimension: longitude {
    type: string
    sql: ${TABLE}.longitude ;;
  }

  dimension: make {
    type: string
    sql: ${TABLE}.make ;;
  }

  dimension: model {
    type: string
    sql: ${TABLE}.model ;;
  }

  dimension: number_of_engines {
    type: number
    sql: ${TABLE}.number_of_engines ;;
  }

  dimension: number_of_fatalities {
    type: number
    sql: ${TABLE}.number_of_fatalities ;;
  }

  dimension: number_of_minor_injuries {
    type: number
    sql: ${TABLE}.number_of_minor_injuries ;;
  }

  dimension: number_of_serious_injuries {
    type: number
    sql: ${TABLE}.number_of_serious_injuries ;;
  }

  dimension: number_of_uninjured {
    type: number
    sql: ${TABLE}.number_of_uninjured ;;
  }

  dimension_group: publication {
    type: time
    timeframes: [
      raw,
      time,
      date,
      week,
      month,
      quarter,
      year
    ]
    sql: ${TABLE}.publication_date ;;
  }

  dimension: purpose_of_flight {
    type: string
    sql: ${TABLE}.purpose_of_flight ;;
  }

  dimension: report_status {
    type: string
    sql: ${TABLE}.report_status ;;
  }

  dimension: schedule {
    type: string
    sql: ${TABLE}.schedule ;;
  }

  dimension: weather_condition {
    type: string
    sql: ${TABLE}.weather_condition ;;
  }

  measure: count {
    type: number
    sql: NULLIF(COUNT(${TABLE}.id),0);;
    drill_fields: [id, airport_name, aircrafts.id, aircrafts.name]
  }
}