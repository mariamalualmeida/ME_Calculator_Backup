package com.simulador.emprestimos.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.simulador.emprestimos.SimuladorEmprestimosScreen
import com.simulador.emprestimos.SimuladorViewModel
import com.simulador.emprestimos.ui.admin.AdminScreen
import com.simulador.emprestimos.ui.settings.SettingsScreen

sealed class Screen(val route: String) {
    object Simulador : Screen("simulador")
    object Settings : Screen("settings")
    object Admin : Screen("admin")
}

@Composable
fun NavigationController(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Simulador.route
    ) {
        composable(Screen.Simulador.route) {
            val viewModel: SimuladorViewModel = viewModel()
            SimuladorEmprestimosScreen(
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                viewModel = viewModel
            )
        }
        
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToAdmin = {
                    navController.navigate(Screen.Admin.route)
                }
            )
        }
        
        composable(Screen.Admin.route) {
            AdminScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}