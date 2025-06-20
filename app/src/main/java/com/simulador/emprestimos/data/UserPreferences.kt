package com.simulador.emprestimos.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

class UserPreferences(private val context: Context) {
    
    companion object {
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        
        // Keys para os limites de juros (1 a 15 parcelas)
        private val LIMITE_1_MIN = doublePreferencesKey("limite_1_min")
        private val LIMITE_1_MAX = doublePreferencesKey("limite_1_max")
        private val LIMITE_2_MIN = doublePreferencesKey("limite_2_min")
        private val LIMITE_2_MAX = doublePreferencesKey("limite_2_max")
        private val LIMITE_3_MIN = doublePreferencesKey("limite_3_min")
        private val LIMITE_3_MAX = doublePreferencesKey("limite_3_max")
        private val LIMITE_4_MIN = doublePreferencesKey("limite_4_min")
        private val LIMITE_4_MAX = doublePreferencesKey("limite_4_max")
        private val LIMITE_5_MIN = doublePreferencesKey("limite_5_min")
        private val LIMITE_5_MAX = doublePreferencesKey("limite_5_max")
        private val LIMITE_6_MIN = doublePreferencesKey("limite_6_min")
        private val LIMITE_6_MAX = doublePreferencesKey("limite_6_max")
        private val LIMITE_7_MIN = doublePreferencesKey("limite_7_min")
        private val LIMITE_7_MAX = doublePreferencesKey("limite_7_max")
        private val LIMITE_8_MIN = doublePreferencesKey("limite_8_min")
        private val LIMITE_8_MAX = doublePreferencesKey("limite_8_max")
        private val LIMITE_9_MIN = doublePreferencesKey("limite_9_min")
        private val LIMITE_9_MAX = doublePreferencesKey("limite_9_max")
        private val LIMITE_10_MIN = doublePreferencesKey("limite_10_min")
        private val LIMITE_10_MAX = doublePreferencesKey("limite_10_max")
        private val LIMITE_11_MIN = doublePreferencesKey("limite_11_min")
        private val LIMITE_11_MAX = doublePreferencesKey("limite_11_max")
        private val LIMITE_12_MIN = doublePreferencesKey("limite_12_min")
        private val LIMITE_12_MAX = doublePreferencesKey("limite_12_max")
        private val LIMITE_13_MIN = doublePreferencesKey("limite_13_min")
        private val LIMITE_13_MAX = doublePreferencesKey("limite_13_max")
        private val LIMITE_14_MIN = doublePreferencesKey("limite_14_min")
        private val LIMITE_14_MAX = doublePreferencesKey("limite_14_max")
        private val LIMITE_15_MIN = doublePreferencesKey("limite_15_min")
        private val LIMITE_15_MAX = doublePreferencesKey("limite_15_max")
    }
    
    // Valores padrão conforme nova tabela de limites
    private val limitesDefault = mapOf(
        1 to Pair(15.00, 100.00),
        2 to Pair(15.00, 100.00),
        3 to Pair(15.00, 30.00),
        4 to Pair(15.00, 24.00),
        5 to Pair(15.00, 22.00),
        6 to Pair(15.00, 20.00),
        7 to Pair(14.75, 18.00),
        8 to Pair(14.36, 17.00),
        9 to Pair(13.92, 16.00),
        10 to Pair(13.47, 15.00),
        11 to Pair(13.03, 14.00),
        12 to Pair(12.60, 13.00),
        13 to Pair(12.19, 12.60),
        14 to Pair(11.80, 12.19),
        15 to Pair(11.43, 11.80)
    )
    
    val userName: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[USER_NAME_KEY] ?: ""
    }
    
    suspend fun saveUserName(name: String) {
        context.dataStore.edit { preferences ->
            preferences[USER_NAME_KEY] = name
        }
    }
    
    val limitesJuros: Flow<Map<Int, Pair<Double, Double>>> = context.dataStore.data.map { preferences ->
        mapOf(
            1 to Pair(
                preferences[LIMITE_1_MIN] ?: limitesDefault[1]!!.first,
                preferences[LIMITE_1_MAX] ?: limitesDefault[1]!!.second
            ),
            2 to Pair(
                preferences[LIMITE_2_MIN] ?: limitesDefault[2]!!.first,
                preferences[LIMITE_2_MAX] ?: limitesDefault[2]!!.second
            ),
            3 to Pair(
                preferences[LIMITE_3_MIN] ?: limitesDefault[3]!!.first,
                preferences[LIMITE_3_MAX] ?: limitesDefault[3]!!.second
            ),
            4 to Pair(
                preferences[LIMITE_4_MIN] ?: limitesDefault[4]!!.first,
                preferences[LIMITE_4_MAX] ?: limitesDefault[4]!!.second
            ),
            5 to Pair(
                preferences[LIMITE_5_MIN] ?: limitesDefault[5]!!.first,
                preferences[LIMITE_5_MAX] ?: limitesDefault[5]!!.second
            ),
            6 to Pair(
                preferences[LIMITE_6_MIN] ?: limitesDefault[6]!!.first,
                preferences[LIMITE_6_MAX] ?: limitesDefault[6]!!.second
            ),
            7 to Pair(
                preferences[LIMITE_7_MIN] ?: limitesDefault[7]!!.first,
                preferences[LIMITE_7_MAX] ?: limitesDefault[7]!!.second
            ),
            8 to Pair(
                preferences[LIMITE_8_MIN] ?: limitesDefault[8]!!.first,
                preferences[LIMITE_8_MAX] ?: limitesDefault[8]!!.second
            ),
            9 to Pair(
                preferences[LIMITE_9_MIN] ?: limitesDefault[9]!!.first,
                preferences[LIMITE_9_MAX] ?: limitesDefault[9]!!.second
            ),
            10 to Pair(
                preferences[LIMITE_10_MIN] ?: limitesDefault[10]!!.first,
                preferences[LIMITE_10_MAX] ?: limitesDefault[10]!!.second
            ),
            11 to Pair(
                preferences[LIMITE_11_MIN] ?: limitesDefault[11]!!.first,
                preferences[LIMITE_11_MAX] ?: limitesDefault[11]!!.second
            ),
            12 to Pair(
                preferences[LIMITE_12_MIN] ?: limitesDefault[12]!!.first,
                preferences[LIMITE_12_MAX] ?: limitesDefault[12]!!.second
            ),
            13 to Pair(
                preferences[LIMITE_13_MIN] ?: limitesDefault[13]!!.first,
                preferences[LIMITE_13_MAX] ?: limitesDefault[13]!!.second
            ),
            14 to Pair(
                preferences[LIMITE_14_MIN] ?: limitesDefault[14]!!.first,
                preferences[LIMITE_14_MAX] ?: limitesDefault[14]!!.second
            ),
            15 to Pair(
                preferences[LIMITE_15_MIN] ?: limitesDefault[15]!!.first,
                preferences[LIMITE_15_MAX] ?: limitesDefault[15]!!.second
            )
        )
    }
    
    suspend fun updateLimiteJuros(parcelas: Int, minimo: Double, maximo: Double) {
        context.dataStore.edit { preferences ->
            when (parcelas) {
                1 -> {
                    preferences[LIMITE_1_MIN] = minimo
                    preferences[LIMITE_1_MAX] = maximo
                }
                2 -> {
                    preferences[LIMITE_2_MIN] = minimo
                    preferences[LIMITE_2_MAX] = maximo
                }
                3 -> {
                    preferences[LIMITE_3_MIN] = minimo
                    preferences[LIMITE_3_MAX] = maximo
                }
                4 -> {
                    preferences[LIMITE_4_MIN] = minimo
                    preferences[LIMITE_4_MAX] = maximo
                }
                5 -> {
                    preferences[LIMITE_5_MIN] = minimo
                    preferences[LIMITE_5_MAX] = maximo
                }
                6 -> {
                    preferences[LIMITE_6_MIN] = minimo
                    preferences[LIMITE_6_MAX] = maximo
                }
                7 -> {
                    preferences[LIMITE_7_MIN] = minimo
                    preferences[LIMITE_7_MAX] = maximo
                }
                8 -> {
                    preferences[LIMITE_8_MIN] = minimo
                    preferences[LIMITE_8_MAX] = maximo
                }
                9 -> {
                    preferences[LIMITE_9_MIN] = minimo
                    preferences[LIMITE_9_MAX] = maximo
                }
                10 -> {
                    preferences[LIMITE_10_MIN] = minimo
                    preferences[LIMITE_10_MAX] = maximo
                }
                11 -> {
                    preferences[LIMITE_11_MIN] = minimo
                    preferences[LIMITE_11_MAX] = maximo
                }
                12 -> {
                    preferences[LIMITE_12_MIN] = minimo
                    preferences[LIMITE_12_MAX] = maximo
                }
                13 -> {
                    preferences[LIMITE_13_MIN] = minimo
                    preferences[LIMITE_13_MAX] = maximo
                }
                14 -> {
                    preferences[LIMITE_14_MIN] = minimo
                    preferences[LIMITE_14_MAX] = maximo
                }
                15 -> {
                    preferences[LIMITE_15_MIN] = minimo
                    preferences[LIMITE_15_MAX] = maximo
                }
            }
        }
    }
}