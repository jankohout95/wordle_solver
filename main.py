import solver as solver

if __name__ == "__main__":
    first_guess = "salet"
    results, decision_map = solver.simulate_games(
        first_guess=first_guess,
        priors=solver.simulations.get_true_wordle_prior(),
        optimize_for_uniform_distribution=True,
        # shuffle=True,
        # brute_force_optimize=True,
        # hard_mode=True,
    )
    # print(results)
    # print(decision_map)

