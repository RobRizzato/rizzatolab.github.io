const SpinPairSimulator = (() => {
  const states = ["S0", "S1", "LTp", "LT0", "LTm", "P0", "P1", "P2", "P3"];

  const stateLabels = {
    S0: "Defect A ground singlet S0",
    S1: "Defect A excited singlet S1",
    LTp: "Localized triplet T+ on A",
    LT0: "Localized triplet T0 on A",
    LTm: "Localized triplet T- on A",
    P0: "Pair eigenstate P0",
    P1: "Pair eigenstate P1",
    P2: "Pair eigenstate P2",
    P3: "Pair eigenstate P3",
  };

  const defaultParams = {
    kExc: 1.2,
    kRad: 0.72,
    kNonRad: 0.08,
    kISC: 0.2559,
    branchTp: 0.25,
    branchT0: 0.5,
    branchTm: 0.25,
    kTripletToSinglet: 0.02139,
    kTripletSpinRelax: 0.03,
    defectSocTpm: 0.8,
    defectSocT0: 1.25,
    defectVibronicWidthMHz: 120,
    kCrtSinglet: 0.7595,
    kCrtTriplet: 0.0104,
    kRecSingletToS1: 0.3634,
    kRecSingletToS0: 0.0175,
    kRecTriplet: 0.1216,
    brightPairYield: 0.372,
    defectCenterMHz: 2870,
    defectStrainMHz: 0,
    defectGyroMHzPermT: 2.8,
    pairDistanceNm: 2.648,
    pairThetaDeg: 53.84,
    pairPhiDeg: 0,
    pairExchangeMHz: -4.185,
    pairG1: 2.0126,
    pairG2: 1.9559,
    kPairSpinRelax: 0,
    kPairDiss: 0,
    pairDistanceSigmaNm: 0,
    pairThetaSigmaDeg: 0,
    pairExchangeSigmaMHz: 0,
    regimeMode: "single",
    hyperfineALong_MHz: 0,
    hyperfineATrans_MHz: 0,
    hyperfineBLong_MHz: 0,
    hyperfineBTrans_MHz: 0,
    ensembleSamples: 1,
    biasFieldmT: 28.075,
    mwB1mT: 0.466,
    dephasingMHz: 8,
    odmrCenter: 790.629,
    odmrSpan: 60,
    odmrPoints: 121,
    traceDuration: 30,
    tracePoints: 180,
    initDuration: 5,
    mwPulseDuration: 2,
    readDuration: 0.5,
    rabiMaxDuration: 5,
    rabiPoints: 61,
    t1MaxDuration: 50,
    t1Points: 41,
  };

  const positivePreset = {
    ...defaultParams,
    // Strongly singlet-dominant creation and bright recombination so that
    // MW mixing singlet → triplet pair character reduces PL (positive contrast).
    kCrtSinglet: 1.1,
    kCrtTriplet: 0.003,
    kRecSingletToS1: 0.7,
    kRecSingletToS0: 0.005,
    kRecTriplet: 0.008,
    brightPairYield: 0.65,
  };
  const realisticPreset = {
    ...defaultParams,
    regimeMode: "single",
    pairDistanceNm: 1.6,
    pairThetaDeg: 32,
    pairExchangeMHz: 2.5,
    pairG1: 2.0023,
    pairG2: 2.0023,
    hyperfineALong_MHz: 1.5,
    hyperfineATrans_MHz: 5,
    hyperfineBLong_MHz: 1.5,
    hyperfineBTrans_MHz: 5,
    ensembleSamples: 1,
    kExc: 1.0,
    kRad: 0.7,
    kNonRad: 0.05,
    kISC: 0.08,
    brightPairYield: 0.08,
    branchTp: 0.25,
    branchT0: 0.5,
    branchTm: 0.25,
    kTripletToSinglet: 0.015,
    kTripletSpinRelax: 0.02,
    defectSocTpm: 0.8,
    defectSocT0: 1.35,
    defectVibronicWidthMHz: 140,
    kCrtSinglet: 0.05,
    kCrtTriplet: 0.015,
    kRecSingletToS1: 0.08,
    kRecSingletToS0: 0.02,
    kRecTriplet: 0.03,
    defectCenterMHz: 2870,
    defectStrainMHz: 6,
    defectGyroMHzPermT: 2.8,
    biasFieldmT: 18,
    mwB1mT: 0.08,
    dephasingMHz: 10,
    odmrCenter: 520,
    odmrSpan: 300,
    odmrPoints: 121,
    traceDuration: 25,
    tracePoints: 160,
  };

  const parameterSections = [
    {
      title: "A-B pair Hamiltonian",
      items: [
        ["pairDistanceNm", "e-e distance r", "Distance between electron on A and electron on B (nm)"],
        ["pairThetaDeg", "theta", "Polar angle between A-B axis and B0 (deg)"],
        ["pairPhiDeg", "phi", "Azimuthal angle of A-B axis around B0 (deg). Rotates MW coupling between Sx-like and Sy-like transitions."],
        ["pairExchangeMHz", "J exchange", "Isotropic exchange coupling J (MHz)"],
        ["pairG1", "g1", "g-factor of electron on A"],
        ["pairG2", "g2", "g-factor of electron on B"],
      ],
    },
    {
      title: "Hyperfine and ensemble",
      items: [
        ["hyperfineALong_MHz", "A hyperfine long.", "Longitudinal local-field component on spin A (MHz, or rms width in ensemble mode)"],
        ["hyperfineATrans_MHz", "A hyperfine trans.", "Transverse local-field component on spin A (MHz, or rms width in ensemble mode)"],
        ["hyperfineBLong_MHz", "B hyperfine long.", "Longitudinal local-field component on spin B (MHz, or rms width in ensemble mode)"],
        ["hyperfineBTrans_MHz", "B hyperfine trans.", "Transverse local-field component on spin B (MHz, or rms width in ensemble mode)"],
        ["pairDistanceSigmaNm", "sigma_r (nm)", "Gaussian rms width of pair distance distribution (ensemble mode only, 0 = monodisperse)"],
        ["pairThetaSigmaDeg", "sigma_theta (deg)", "Gaussian rms width of pair polar angle distribution (ensemble mode only, 0 = monodisperse)"],
        ["pairExchangeSigmaMHz", "sigma_J (MHz)", "Gaussian rms width of exchange coupling distribution (ensemble mode only, 0 = monodisperse)"],
        ["ensembleSamples", "Ensemble samples", "Number of static disorder realizations averaged in the solver"],
      ],
    },
    {
      title: "Localized defect A",
      items: [
        ["kExc", "Laser excitation (us^-1)", "S0_A -> S1_A"],
        ["kRad", "Radiative decay (us^-1)", "S1_A -> S0_A"],
        ["kNonRad", "Non-radiative decay (us^-1)", "S1_A -> S0_A"],
        ["kISC", "ISC rate (us^-1)", "S1_A -> local triplet manifold on A"],
        ["brightPairYield", "Bright pair yield", "Optional PL yield from singlet-like pair recombination"],
      ],
    },
    {
      title: "Localized triplet A",
      items: [
        ["branchTp", "ISC branch T+", "Fraction of ISC into T+"],
        ["branchT0", "ISC branch T0", "Fraction of ISC into T0"],
        ["branchTm", "ISC branch T-", "Fraction of ISC into T-"],
        ["kTripletToSinglet", "Triplet -> S0_A (us^-1)", "Slow recombination from localized triplet manifold to the ground singlet"],
        ["kTripletSpinRelax", "Triplet spin relaxation (us^-1)", "Localized T+ <-> T0 <-> T-"],
        ["defectSocTpm", "SO coupling T±", "Relative spin-orbit coupling strength of T± to the singlet channel"],
        ["defectSocT0", "SO coupling T0", "Relative spin-orbit coupling strength of T0 to the singlet channel"],
        ["defectVibronicWidthMHz", "Vibronic width", "Energy scale controlling phonon/vibronic assistance for triplet -> singlet transfer (MHz)"],
      ],
    },
    {
      title: "Spin-selective pair kinetics",
      items: [
        ["kCrtSinglet", "k_crt^S (us^-1)", "Spin-pair creation from localized singlet sector into pair eigenstates"],
        ["kCrtTriplet", "k_crt^T (us^-1)", "Spin-pair creation from localized triplet sector into pair eigenstates"],
        ["kRecSingletToS1", "k_rec^S -> S1 (us^-1)", "Singlet-like pair recombination into the bright optical manifold S1_A"],
        ["kRecSingletToS0", "k_rec^S -> S0 (us^-1)", "Direct singlet-like pair recombination into the ground singlet S0_A"],
        ["kRecTriplet", "k_rec^T (us^-1)", "Triplet-like pair recombination into the dark/local triplet manifold"],
        ["kPairSpinRelax", "k_pair_relax (us^-1)", "Spin-lattice T1 relaxation between pair eigenstates (symmetric, all Pi <-> Pj)"],
        ["kPairDiss", "k_pair_diss (us^-1)", "Pair dissociation rate: all Pi -> S0 (dark, no photon). Models charge separation that does not lead to recombination."],
      ],
    },
    {
      title: "Defect A Hamiltonian",
      items: [
        ["defectCenterMHz", "D defect", "Center frequency of localized triplet transitions (MHz)"],
        ["defectStrainMHz", "E defect", "Transverse splitting / strain term (MHz)"],
        ["defectGyroMHzPermT", "gamma defect", "Localized-triplet gyromagnetic factor (MHz/mT)"],
      ],
    },
    {
      title: "Microwave and field",
      items: [
        ["biasFieldmT", "Bias field B0", "Static magnetic field (mT)"],
        ["mwB1mT", "MW transverse field B1", "Microwave drive amplitude (mT)"],
        ["dephasingMHz", "Dephasing width", "Effective transverse dephasing (MHz)"],
      ],
    },
    {
      title: "Simulation",
      items: [
        ["odmrCenter", "Sweep center", "Microwave center frequency (MHz)"],
        ["odmrSpan", "Sweep span", "Total ODMR sweep width (MHz)"],
        ["odmrPoints", "ODMR points", "Number of sweep points"],
        ["traceDuration", "Trace duration (us)", "Transient window in microseconds"],
        ["tracePoints", "Trace points", "Number of transient samples"],
      ],
    },
    {
      title: "Pulsed experiment",
      items: [
        ["initDuration", "Init pulse (us)", "Laser initialization pulse duration in microseconds"],
        ["mwPulseDuration", "MW pulse (us)", "MW pulse duration for pulsed ODMR (init → MW pulse → readout)"],
        ["readDuration", "Readout (us)", "Laser readout window duration after the pulse sequence in microseconds"],
        ["rabiMaxDuration", "Rabi max (us)", "Maximum MW pulse duration for the MW-pulse vs PL curve"],
        ["rabiPoints", "Rabi points", "Number of MW duration points for the Rabi-style curve"],
        ["t1MaxDuration", "T1 max dark (us)", "Maximum dark time for the spin decay (T1) curve"],
        ["t1Points", "T1 points", "Number of dark time points for the T1 curve"],
      ],
    },
  ];

  const parameterHelp = {
    pairDistanceNm: "Sets the A-B separation. Smaller distance strengthens dipolar coupling, changes pair eigenstates, and can shift or reshape the ODMR response.",
    pairThetaDeg: "Polar angle of the A-B axis relative to B0. It changes the angular part of the dipolar Hamiltonian and can move pair transition frequencies or even alter contrast sign trends.",
    pairPhiDeg: "Azimuthal angle of the A-B axis around B0. By rotational symmetry of the Zeeman+dipolar Hamiltonian, eigenvalues and spin weights (wS, wT) are phi-independent. What changes is the MW coupling: I(phi) = cos²(phi)*Mx² + sin²(phi)*My², where My uses the Sy-like operator. At phi=0 only Sx-driven transitions contribute; at phi=90 only Sy-driven ones do. Some transitions are dark at phi=0 but bright at phi=90, so sweeping phi can reveal otherwise hidden pair resonances.",
    pairExchangeMHz: "Controls exchange J between the two electrons. Larger |J| changes singlet-triplet splitting in the pair and strongly affects pair mixing and ODMR line positions.",
    pairG1: "g factor of the electron on defect A. A mismatch between g1 and g2 breaks symmetry, enhances singlet-triplet mixing, and often makes pair ODMR easier to see.",
    pairG2: "g factor of the electron on defect B. If it differs from g1, the two spins precess differently and the pair becomes more ODMR-active.",
    hyperfineALong_MHz: "Longitudinal local field on spin A. It shifts the effective Zeeman energy of spin A and broadens or offsets resonances.",
    hyperfineATrans_MHz: "Transverse local field on spin A. It directly mixes spin states and is one of the main ingredients that can keep ODMR visible even when g1 equals g2.",
    hyperfineBLong_MHz: "Longitudinal local field on spin B. It changes the local Zeeman detuning of the pair and contributes to line shifts and broadening.",
    hyperfineBTrans_MHz: "Transverse local field on spin B. It mixes pair spin character and can strongly change ODMR amplitude and sign through altered singlet-triplet admixture.",
    ensembleSamples: "Number of disorder realizations averaged in ensemble mode. More samples smooth the spectrum and better approximate an inhomogeneous population of pairs.",
    kExc: "Optical pump rate from S0 to S1. Increasing it drives more population through the cycle and usually increases PL until shelving or non-radiative channels dominate.",
    kRad: "Radiative decay rate from S1 to S0. Larger values make the bright optical channel more efficient and typically increase the detected PL.",
    kNonRad: "Non-radiative decay from S1 to S0. Increasing it quenches PL and can reduce ODMR contrast by draining population without emitting light.",
    kISC: "Intersystem crossing rate from S1 into the local triplet manifold. Higher ISC feeds dark/metastable states more strongly and often makes spin-dependent effects more important.",
    brightPairYield: "Fraction of singlet-like pair recombination counted as detected light. Raising it makes the pair branch more optically bright and can change ODMR sign.",
    branchTp: "Baseline ISC preference into the T+ basis component. In the upgraded triplet model this feeds the local triplet eigenstates according to their T+ character.",
    branchT0: "Baseline ISC preference into the T0 basis component. If T0-like states are populated differently, ODMR becomes more likely because MW redistributes non-equivalent eigenstates.",
    branchTm: "Baseline ISC preference into the T- basis component. Together with the other branches it sets which local triplet eigenstates are loaded optically.",
    kTripletToSinglet: "Overall scale for local-triplet return to S0. Larger values shorten triplet lifetime; with spin-dependent eigenstate weights this can generate local-triplet ODMR contrast.",
    kTripletSpinRelax: "Spin-lattice relaxation within the local triplet manifold. It smooths population differences between triplet eigenstates and can either wash out or enable MW redistribution depending on regime.",
    defectSocTpm: "Effective spin-orbit coupling strength for T±-like components. It controls how efficiently T± character connects back to the singlet channel.",
    defectSocT0: "Effective spin-orbit coupling strength for T0-like components. If it differs from the T± value, the local triplet eigenstates become kinetically non-equivalent and ODMR can emerge.",
    defectVibronicWidthMHz: "Energy scale for phonon or vibronic assistance in triplet-to-singlet transfer. Larger values make return rates less sensitive to triplet-level energy differences.",
    kCrtSinglet: "Creation rate of the A-B pair from singlet-like localized states. Larger values push more population into pair eigenstates with singlet weight.",
    kCrtTriplet: "Creation rate of the A-B pair from triplet-like localized states. It feeds pair states through their triplet character and can move population into darker reservoirs.",
    kRecSingletToS1: "Singlet-like pair recombination into the bright excited singlet S1. Increasing it usually strengthens bright recovery and can favor negative or weaker positive ODMR depending on the balance.",
    kRecSingletToS0: "Singlet-like pair recombination directly to S0. This bypasses the bright state and often reduces PL while still emptying the pair sector.",
    kRecTriplet: "Triplet-like pair recombination back to the local triplet manifold. It controls how strongly the pair branch repopulates the dark or metastable sector.",
    kPairSpinRelax: "Symmetric spin-lattice T1 relaxation between all pairs of pair eigenstates Pi <-> Pj. Zero by default. Non-zero values allow the pair manifold to thermalize towards equal populations independently of recombination, which can modulate ODMR contrast by redistributing population among states with different singlet/triplet character.",
    kPairDiss: "Pair dissociation rate. All pair eigenstates Pi drain to S0 with this rate, without producing a photon. Represents charge separation that ends in a dark recombination or long-lived trapped state. Increasing it competes with bright singlet recombination and reduces PL.",
    pairDistanceSigmaNm: "Gaussian rms width for pair distance disorder in ensemble mode. Each realization draws r_i = r + sigma_r * N(0,1). Set to 0 for a monodisperse sample. Broadens ODMR lines and smears distance-sensitive features.",
    pairThetaSigmaDeg: "Gaussian rms width for polar angle disorder in ensemble mode. Each realization draws theta_i = theta + sigma_theta * N(0,1). Averages over different dipolar anisotropies and can wash out orientation-sensitive contrast features.",
    pairExchangeSigmaMHz: "Gaussian rms width for exchange coupling disorder in ensemble mode. Each realization draws J_i = J + sigma_J * N(0,1). Broadens pair transition lines and smears exchange-sensitive features.",
    defectCenterMHz: "Zero-field triplet splitting scale D of the local defect. It sets the main frequency location of local-triplet ODMR transitions.",
    defectStrainMHz: "Transverse splitting E of the local triplet. It mixes the triplet basis states and changes both zero-field splitting and ODMR visibility.",
    defectGyroMHzPermT: "Gyromagnetic factor of the local triplet in MHz per mT. It determines how strongly B0 shifts and splits the local-triplet resonances.",
    biasFieldmT: "Static magnetic field B0. It Zeeman-splits both the local triplet and the A-B pair, shifting energies, mixing patterns, and ODMR peak positions.",
    mwB1mT: "Transverse microwave drive amplitude B1. Larger B1 increases MW-induced transitions and generally makes ODMR stronger, broader, or more power-broadened.",
    dephasingMHz: "Effective linewidth or dephasing scale. Larger values broaden resonances and reduce peak sharpness.",
    odmrCenter: "Center frequency of the ODMR sweep. Move it near the expected local-triplet or pair transitions if you want to see peaks clearly.",
    odmrSpan: "Total frequency window of the sweep. A very large span can make real peaks look tiny; a narrower span makes them easier to inspect.",
    odmrPoints: "Number of sampled points in the ODMR sweep. More points give smoother curves and better resolved peaks.",
    traceDuration: "Time window of the PL transient in microseconds. Use it to see how quickly the system reaches steady state or gets shelved in dark states.",
    tracePoints: "Number of points in the transient trace. More points give a smoother time-resolved curve.",
    initDuration: "Duration of the laser initialization pulse in microseconds. In a real experiment this polarizes the defect into its spin ground state. Longer init drives the population closer to the laser-on steady state.",
    mwPulseDuration: "Duration of the MW pulse in the pulsed ODMR sequence (init → MW pulse → readout). This sets the fixed MW pulse length used for the pulsed ODMR frequency sweep.",
    readDuration: "Laser readout window after the pulse sequence. PL is integrated over this window and compared to the reference (no MW) to compute pulsed contrast.",
    rabiMaxDuration: "Maximum MW pulse duration for the MW-pulse vs PL curve. The sequence is init → MW pulse (variable, 0 to rabiMax) → readout. In this rate-equation model you get exponential spin-state transfer, not coherent Rabi oscillations.",
    rabiPoints: "Number of time points in the MW-pulse duration sweep for the Rabi-style curve.",
    t1MaxDuration: "Maximum dark time for the spin decay curve. Sequence is init → dark (no laser, no MW, variable duration) → readout. Shows how the spin-polarized population relaxes toward the dark equilibrium.",
    t1Points: "Number of dark time steps for the T1 decay curve."
  };

  const stateIndex = Object.fromEntries(states.map((state, index) => [state, index]));

  function createMatrix(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function addTransition(matrix, from, to, rate) {
    if (!(rate > 0)) return;
    const fromIndex = stateIndex[from];
    const toIndex = stateIndex[to];
    matrix[toIndex][fromIndex] += rate;
    matrix[fromIndex][fromIndex] -= rate;
  }

  function branchFractions(params) {
    const total = Math.max(1e-12, params.branchTp + params.branchT0 + params.branchTm);
    return {
      LTp: params.branchTp / total,
      LT0: params.branchT0 / total,
      LTm: params.branchTm / total,
    };
  }

  function identityMatrix(size) {
    return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)));
  }

  function zeroMatrix(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function zeros4() {
    return zeroMatrix(4);
  }

  function addScaledMatrix(target, matrix, scale) {
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 4; j += 1) target[i][j] += scale * matrix[i][j];
    }
  }

  function jacobiEigenDecompositionSymmetric4(matrix) {
    const size = matrix.length;
    const a = matrix.map((row) => [...row]);
    const v = identityMatrix(size);
    for (let iter = 0; iter < 80; iter += 1) {
      let p = 0;
      let q = 1;
      let max = Math.abs(a[p][q]);
      for (let i = 0; i < size; i += 1) {
        for (let j = i + 1; j < size; j += 1) {
          const candidate = Math.abs(a[i][j]);
          if (candidate > max) {
            max = candidate;
            p = i;
            q = j;
          }
        }
      }
      if (max < 1e-12) break;

      const app = a[p][p];
      const aqq = a[q][q];
      const apq = a[p][q];
      const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
      const c = Math.cos(phi);
      const s = Math.sin(phi);

      for (let k = 0; k < size; k += 1) {
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[k][q] = s * akp + c * akq;
      }

      for (let k = 0; k < size; k += 1) {
        const apk = a[p][k];
        const aqk = a[q][k];
        a[p][k] = c * apk - s * aqk;
        a[q][k] = s * apk + c * aqk;
      }

      a[p][q] = 0;
      a[q][p] = 0;

      for (let k = 0; k < size; k += 1) {
        const vkp = v[k][p];
        const vkq = v[k][q];
        v[k][p] = c * vkp - s * vkq;
        v[k][q] = s * vkp + c * vkq;
      }
    }

    const eigenpairs = Array.from({ length: size }, (_, i) => ({
      value: a[i][i],
      vector: Array.from({ length: size }, (_, row) => v[row][i]),
    })).sort((x, y) => x.value - y.value);

    return {
      values: eigenpairs.map((item) => item.value),
      vectors: eigenpairs.map((item) => item.vector),
    };
  }

  function dot(a, b) {
    return a.reduce((sum, value, index) => sum + value * b[index], 0);
  }

  function expectationBraKet(bra, operator, ket) {
    let sum = 0;
    for (let i = 0; i < bra.length; i += 1) {
      for (let j = 0; j < ket.length; j += 1) sum += bra[i] * operator[i][j] * ket[j];
    }
    return sum;
  }

  function spinOperators() {
    const sx1 = [
      [0, 0, 0.5, 0],
      [0, 0, 0, 0.5],
      [0.5, 0, 0, 0],
      [0, 0.5, 0, 0],
    ];
    const sx2 = [
      [0, 0.5, 0, 0],
      [0.5, 0, 0, 0],
      [0, 0, 0, 0.5],
      [0, 0, 0.5, 0],
    ];
    const sy1sy2 = [
      [0, 0, 0, -0.25],
      [0, 0, 0.25, 0],
      [0, 0.25, 0, 0],
      [-0.25, 0, 0, 0],
    ];
    const sz1 = [
      [0.5, 0, 0, 0],
      [0, 0.5, 0, 0],
      [0, 0, -0.5, 0],
      [0, 0, 0, -0.5],
    ];
    const sz2 = [
      [0.5, 0, 0, 0],
      [0, -0.5, 0, 0],
      [0, 0, 0.5, 0],
      [0, 0, 0, -0.5],
    ];
    const sx1sx2 = [
      [0, 0, 0, 0.25],
      [0, 0, 0.25, 0],
      [0, 0.25, 0, 0],
      [0.25, 0, 0, 0],
    ];
    const sz1sz2 = [
      [0.25, 0, 0, 0],
      [0, -0.25, 0, 0],
      [0, 0, -0.25, 0],
      [0, 0, 0, 0.25],
    ];
    const sx1sz2 = [
      [0, 0, 0.25, 0],
      [0, 0, 0, -0.25],
      [0.25, 0, 0, 0],
      [0, -0.25, 0, 0],
    ];
    const sz1sx2 = [
      [0, 0.25, 0, 0],
      [0.25, 0, 0, 0],
      [0, 0, 0, -0.25],
      [0, 0, -0.25, 0],
    ];
    // Real part of (-i*Sy) for each spin, used to compute the Sy-component of MW
    // matrix elements without complex arithmetic.
    // Derivation: Sy = (i/2)*[[0,0,-1,0],[0,0,0,-1],[1,0,0,0],[0,1,0,0]] (spin 1)
    // => (-i)*Sy1 = (1/2)*[[0,0,-1,0],[0,0,0,-1],[1,0,0,0],[0,1,0,0]]
    const snx1 = [
      [0, 0, -0.5, 0],
      [0, 0, 0, -0.5],
      [0.5, 0, 0, 0],
      [0, 0.5, 0, 0],
    ];
    // (-i)*Sy2 = (1/2)*[[0,-1,0,0],[1,0,0,0],[0,0,0,-1],[0,0,1,0]]
    const snx2 = [
      [0, -0.5, 0, 0],
      [0.5, 0, 0, 0],
      [0, 0, 0, -0.5],
      [0, 0, 0.5, 0],
    ];
    return { sx1, sx2, sy1sy2, sz1, sz2, sx1sx2, sz1sz2, sx1sz2, sz1sx2, snx1, snx2 };
  }

  function localTripletHamiltonian(params) {
    const sz = [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, -1],
    ];
    const sz2 = [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 1],
    ];
    const exy = [
      [0, 0, 1],
      [0, 0, 0],
      [1, 0, 0],
    ];
    const sx = [
      [0, Math.SQRT1_2, 0],
      [Math.SQRT1_2, 0, Math.SQRT1_2],
      [0, Math.SQRT1_2, 0],
    ];
    const h = zeroMatrix(3);
    const add3 = (matrix, scale) => {
      for (let i = 0; i < 3; i += 1) {
        for (let j = 0; j < 3; j += 1) h[i][j] += scale * matrix[i][j];
      }
    };
    add3(sz2, params.defectCenterMHz);
    add3(exy, params.defectStrainMHz);
    add3(sz, params.defectGyroMHzPermT * params.biasFieldmT);

    const eig = jacobiEigenDecompositionSymmetric4(h);
    const basisTp = [1, 0, 0];
    const basisT0 = [0, 1, 0];
    const basisTm = [0, 0, 1];
    const mwOperator = sx.map((row) => row.map((value) => value * params.defectGyroMHzPermT));
    const energies = eig.values;
    const meanEnergy = energies.reduce((sum, value) => sum + value, 0) / energies.length;
    const vibWidth = Math.max(1e-9, Math.abs(params.defectVibronicWidthMHz));

    const eigenstates = eig.vectors.map((vector, index) => {
      const wTp = Math.pow(dot(vector, basisTp), 2);
      const wT0 = Math.pow(dot(vector, basisT0), 2);
      const wTm = Math.pow(dot(vector, basisTm), 2);
      const soAmplitude = params.defectSocTpm * (wTp + wTm) + params.defectSocT0 * wT0;
      const vibronicFactor = Math.exp(-Math.abs(energies[index] - meanEnergy) / vibWidth);
      return {
        label: `LT${index}`,
        energy: energies[index],
        vector,
        wTp,
        wT0,
        wTm,
        iscWeight: 0,
        singletRateWeightRaw: Math.max(1e-9, soAmplitude * soAmplitude * vibronicFactor),
        singletRateWeight: 0,
      };
    });

    const branch = branchFractions(params);
    const iscRaw = eigenstates.map((state) => branch.LTp * state.wTp + branch.LT0 * state.wT0 + branch.LTm * state.wTm);
    const iscNorm = Math.max(1e-12, iscRaw.reduce((sum, value) => sum + value, 0));
    const singletNorm = Math.max(1e-12, eigenstates.reduce((sum, state) => sum + state.singletRateWeightRaw, 0) / eigenstates.length);
    eigenstates.forEach((state, index) => {
      state.iscWeight = iscRaw[index] / iscNorm;
      state.singletRateWeight = state.singletRateWeightRaw / singletNorm;
    });

    const transitions = [];
    for (let i = 0; i < eigenstates.length; i += 1) {
      for (let j = i + 1; j < eigenstates.length; j += 1) {
        const freq = Math.abs(eigenstates[j].energy - eigenstates[i].energy);
        const matrixElement = expectationBraKet(eigenstates[i].vector, mwOperator, eigenstates[j].vector);
        const intensity = matrixElement * matrixElement;
        if (freq > 1e-9 && intensity > 1e-10) transitions.push({ from: i, to: j, freq, intensity });
      }
    }
    transitions.sort((a, b) => b.intensity - a.intensity);

    return {
      eigenstates,
      transitions,
      mwOperator,
      minus: transitions[0] ? transitions[0].freq : 0,
      plus: transitions[1] ? transitions[1].freq : (transitions[0] ? transitions[0].freq : 0),
      split: transitions.length > 1 ? Math.abs(transitions[1].freq - transitions[0].freq) : 0,
    };
  }

  function pairHamiltonian(params, sample = {
    hyperfineALong_MHz: 0,
    hyperfineATrans_MHz: 0,
    hyperfineBLong_MHz: 0,
    hyperfineBTrans_MHz: 0,
  }) {
    const muBOverHMHzPermT = 13.99624555;
    const gamma1 = muBOverHMHzPermT * params.pairG1;
    const gamma2 = muBOverHMHzPermT * params.pairG2;
    // Sample can override r, theta, J for ensemble geometry disorder.
    const r = Math.max(0.1, Math.abs(sample.pairDistanceNm !== undefined ? sample.pairDistanceNm : params.pairDistanceNm));
    const thetaDeg = sample.pairThetaDeg !== undefined ? sample.pairThetaDeg : params.pairThetaDeg;
    const theta = (thetaDeg * Math.PI) / 180;
    const exchangeMHz = sample.pairExchangeMHz !== undefined ? sample.pairExchangeMHz : params.pairExchangeMHz;
    const dipolarConstMHzNm3 = 52.04;
    const dipolarMHz = dipolarConstMHzNm3 / (r * r * r);

    const ops = spinOperators();
    const h = zeros4();
    addScaledMatrix(h, ops.sz1, gamma1 * params.biasFieldmT + (sample.hyperfineALong_MHz || 0));
    addScaledMatrix(h, ops.sz2, gamma2 * params.biasFieldmT + (sample.hyperfineBLong_MHz || 0));
    addScaledMatrix(h, ops.sx1, sample.hyperfineATrans_MHz || 0);
    addScaledMatrix(h, ops.sx2, sample.hyperfineBTrans_MHz || 0);

    addScaledMatrix(h, ops.sx1sx2, exchangeMHz + dipolarMHz * (1 - 3 * Math.sin(theta) * Math.sin(theta)));
    addScaledMatrix(h, ops.sy1sy2, exchangeMHz + dipolarMHz);
    addScaledMatrix(h, ops.sz1sz2, exchangeMHz + dipolarMHz * (1 - 3 * Math.cos(theta) * Math.cos(theta)));
    addScaledMatrix(h, ops.sx1sz2, -3 * dipolarMHz * Math.sin(theta) * Math.cos(theta));
    addScaledMatrix(h, ops.sz1sx2, -3 * dipolarMHz * Math.sin(theta) * Math.cos(theta));

    const eig = jacobiEigenDecompositionSymmetric4(h);
    const singlet = [0, 1 / Math.sqrt(2), -1 / Math.sqrt(2), 0];
    const tripletPlus = [1, 0, 0, 0];
    const tripletZero = [0, 1 / Math.sqrt(2), 1 / Math.sqrt(2), 0];
    const tripletMinus = [0, 0, 0, 1];

    // MW coupling operators for the two polarization components.
    // mwOperatorX: Sx-driven (phi=0), mwOperatorY: Sy-driven (phi=90).
    // By rotational symmetry about B0, eigenvalues and wS/wT weights are
    // phi-independent. Only transition intensities change:
    //   I(phi) = cos²(phi)*Mx² + sin²(phi)*My²
    // My is computed via (-i*Sy) — a real matrix — to avoid complex arithmetic.
    const phi = (params.pairPhiDeg * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const mwOperatorX = zeros4();
    addScaledMatrix(mwOperatorX, ops.sx1, gamma1);
    addScaledMatrix(mwOperatorX, ops.sx2, gamma2);

    const mwOperatorY = zeros4();
    addScaledMatrix(mwOperatorY, ops.snx1, gamma1);
    addScaledMatrix(mwOperatorY, ops.snx2, gamma2);

    const eigenstates = eig.vectors.map((vector, index) => {
      const wS = Math.pow(dot(vector, singlet), 2);
      const wTp = Math.pow(dot(vector, tripletPlus), 2);
      const wT0 = Math.pow(dot(vector, tripletZero), 2);
      const wTm = Math.pow(dot(vector, tripletMinus), 2);
      return {
        label: `P${index}`,
        energy: eig.values[index],
        vector,
        wS,
        wTp,
        wT0,
        wTm,
      };
    });

    const transitions = [];
    for (let i = 0; i < eigenstates.length; i += 1) {
      for (let j = i + 1; j < eigenstates.length; j += 1) {
        const freq = Math.abs(eigenstates[j].energy - eigenstates[i].energy);
        const Mx = expectationBraKet(eigenstates[i].vector, mwOperatorX, eigenstates[j].vector);
        const My = expectationBraKet(eigenstates[i].vector, mwOperatorY, eigenstates[j].vector);
        const intensity = cosPhi * cosPhi * Mx * Mx + sinPhi * sinPhi * My * My;
        if (freq > 1e-9 && intensity > 1e-10) transitions.push({ from: i, to: j, freq, intensity });
      }
    }
    transitions.sort((a, b) => b.intensity - a.intensity);

    const strongest = transitions.slice(0, 2).sort((a, b) => a.freq - b.freq);

    return {
      gamma1,
      gamma2,
      dipolarMHz,
      eigenstates,
      transitions,
      mwOperator: mwOperatorX,
      minus: strongest[0] ? strongest[0].freq : 0,
      plus: strongest[1] ? strongest[1].freq : (strongest[0] ? strongest[0].freq : 0),
      split: strongest[1] ? strongest[1].freq - strongest[0].freq : 0,
    };
  }

  function transverseDriveScale(deltaMHz, omegaRMHz, gamma2MHz) {
    const omega = Math.max(1e-9, Math.abs(omegaRMHz));
    const gamma2 = Math.max(1e-9, Math.abs(gamma2MHz));
    return (omega * omega) / (deltaMHz * deltaMHz + gamma2 * gamma2 + omega * omega);
  }

  function effectiveMwResponse(params, frequencyMHz, pairInfo, localTriplet) {
    const gamma2 = Math.max(1e-9, Math.abs(params.dephasingMHz));
    const omegaRDefect = Math.abs(params.defectGyroMHzPermT * params.mwB1mT);
    const omegaRPair = Math.abs(0.5 * (pairInfo.gamma1 + pairInfo.gamma2) * params.mwB1mT);
    const tripletTransitions = localTriplet.transitions.map((transition) => {
      const normalizedIntensity = transition.intensity / Math.max(1e-12, localTriplet.transitions[0] ? localTriplet.transitions[0].intensity : 1);
      return {
        ...transition,
        rate: omegaRDefect * normalizedIntensity * transverseDriveScale(frequencyMHz - transition.freq, omegaRDefect, gamma2),
      };
    });

    const pairTransitions = pairInfo.transitions.map((transition) => {
      const normalizedIntensity = transition.intensity / Math.max(1e-12, pairInfo.transitions[0] ? pairInfo.transitions[0].intensity : 1);
      return {
        ...transition,
        rate: omegaRPair * normalizedIntensity * transverseDriveScale(frequencyMHz - transition.freq, omegaRPair, gamma2),
      };
    });

    return {
      defect: localTriplet,
      tripletTransitions,
      pairTransitions,
    };
  }

  function buildRateMatrix(params, mwFrequencyMHz, mwEnabled, sample = {
    hyperfineALong_MHz: 0,
    hyperfineATrans_MHz: 0,
    hyperfineBLong_MHz: 0,
    hyperfineBTrans_MHz: 0,
  }) {
    const matrix = createMatrix(states.length);
    const pair = pairHamiltonian(params, sample);
    const localTriplet = localTripletHamiltonian(params);
    const localTripletStateKeys = ["LTp", "LT0", "LTm"];
    const mw = mwEnabled ? effectiveMwResponse(params, mwFrequencyMHz, pair, localTriplet) : {
      defect: localTriplet,
      tripletTransitions: [],
      pairTransitions: [],
    };

    addTransition(matrix, "S0", "S1", params.kExc);
    addTransition(matrix, "S1", "S0", params.kRad);
    addTransition(matrix, "S1", "S0", params.kNonRad);

    localTriplet.eigenstates.forEach((eigenstate, index) => {
      addTransition(matrix, "S1", localTripletStateKeys[index], params.kISC * eigenstate.iscWeight);
      addTransition(matrix, localTripletStateKeys[index], "S0", params.kTripletToSinglet * eigenstate.singletRateWeight);
    });

    for (let i = 0; i < localTripletStateKeys.length; i += 1) {
      for (let j = i + 1; j < localTripletStateKeys.length; j += 1) {
        addTransition(matrix, localTripletStateKeys[i], localTripletStateKeys[j], params.kTripletSpinRelax);
        addTransition(matrix, localTripletStateKeys[j], localTripletStateKeys[i], params.kTripletSpinRelax);
      }
    }

    mw.tripletTransitions.forEach((transition) => {
      addTransition(matrix, localTripletStateKeys[transition.from], localTripletStateKeys[transition.to], transition.rate);
      addTransition(matrix, localTripletStateKeys[transition.to], localTripletStateKeys[transition.from], transition.rate);
    });

    pair.eigenstates.forEach((eigenstate, idx) => {
      const pairState = `P${idx}`;
      addTransition(matrix, "S1", pairState, params.kCrtSinglet * eigenstate.wS);
      addTransition(matrix, "LTp", pairState, params.kCrtTriplet * eigenstate.wTp);
      addTransition(matrix, "LT0", pairState, params.kCrtTriplet * eigenstate.wT0);
      addTransition(matrix, "LTm", pairState, params.kCrtTriplet * eigenstate.wTm);

      addTransition(matrix, pairState, "S1", params.kRecSingletToS1 * eigenstate.wS);
      addTransition(matrix, pairState, "S0", params.kRecSingletToS0 * eigenstate.wS);
      addTransition(matrix, pairState, "LTp", params.kRecTriplet * eigenstate.wTp);
      addTransition(matrix, pairState, "LT0", params.kRecTriplet * eigenstate.wT0);
      addTransition(matrix, pairState, "LTm", params.kRecTriplet * eigenstate.wTm);
    });

    mw.pairTransitions.forEach((transition) => {
      addTransition(matrix, `P${transition.from}`, `P${transition.to}`, transition.rate);
      addTransition(matrix, `P${transition.to}`, `P${transition.from}`, transition.rate);
    });

    if (params.kPairSpinRelax > 0) {
      for (let i = 0; i < pair.eigenstates.length; i += 1) {
        for (let j = i + 1; j < pair.eigenstates.length; j += 1) {
          addTransition(matrix, `P${i}`, `P${j}`, params.kPairSpinRelax);
          addTransition(matrix, `P${j}`, `P${i}`, params.kPairSpinRelax);
        }
      }
    }

    if (params.kPairDiss > 0) {
      pair.eigenstates.forEach((_, idx) => {
        addTransition(matrix, `P${idx}`, "S0", params.kPairDiss);
      });
    }

    return { matrix, pair, localTriplet, mw };
  }

  function derivative(matrix, population) {
    const result = Array(population.length).fill(0);
    for (let row = 0; row < matrix.length; row += 1) {
      let sum = 0;
      for (let col = 0; col < matrix.length; col += 1) sum += matrix[row][col] * population[col];
      result[row] = sum;
    }
    return result;
  }

  function renormalize(values) {
    const clipped = values.map((value) => (value < 0 ? 0 : value));
    const total = clipped.reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      const reset = Array(values.length).fill(0);
      reset[stateIndex.S0] = 1;
      return reset;
    }
    return clipped.map((value) => value / total);
  }

  function rk4Step(matrix, population, dt) {
    const k1 = derivative(matrix, population);
    const k2 = derivative(matrix, population.map((v, i) => v + 0.5 * dt * k1[i]));
    const k3 = derivative(matrix, population.map((v, i) => v + 0.5 * dt * k2[i]));
    const k4 = derivative(matrix, population.map((v, i) => v + dt * k3[i]));
    return renormalize(population.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])));
  }

  // Evolve population for a single pulse segment. Returns final population and
  // integrated PL. Set laserOn=false to zero kExc (dark period). Set mwEnabled=false
  // for a dark or laser-only segment.
  function runPulse(params, laserOn, mwEnabled, mwFreqMHz, initialPop, durationUs, sample) {
    if (!(durationUs > 0)) return { finalPop: [...initialPop], integratedPL: 0 };
    const effectiveParams = laserOn ? params : { ...params, kExc: 0 };
    const built = buildRateMatrix(effectiveParams, mwFreqMHz, mwEnabled, sample);
    const maxRate = Math.max(1e-6, ...built.matrix.flat().map((v) => Math.abs(v)));
    const subDt = Math.min(durationUs / 10, 0.04 / maxRate);
    const steps = Math.max(4, Math.ceil(durationUs / subDt));
    const dt = durationUs / steps;
    let pop = [...initialPop];
    let integratedPL = 0;
    for (let step = 0; step < steps; step += 1) {
      integratedPL += plSignal(effectiveParams, pop, built.pair) * dt;
      pop = rk4Step(built.matrix, pop, dt);
    }
    return { finalPop: pop, integratedPL };
  }

  function solveLinearSystem(matrix, vector) {
    const size = vector.length;
    const augmented = matrix.map((row, rowIndex) => [...row, vector[rowIndex]]);
    for (let pivot = 0; pivot < size; pivot += 1) {
      let maxRow = pivot;
      for (let row = pivot + 1; row < size; row += 1) {
        if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) maxRow = row;
      }
      if (Math.abs(augmented[maxRow][pivot]) < 1e-12) continue;
      if (maxRow !== pivot) {
        const temp = augmented[pivot];
        augmented[pivot] = augmented[maxRow];
        augmented[maxRow] = temp;
      }
      const pivotValue = augmented[pivot][pivot];
      for (let col = pivot; col <= size; col += 1) augmented[pivot][col] /= pivotValue;
      for (let row = 0; row < size; row += 1) {
        if (row === pivot) continue;
        const factor = augmented[row][pivot];
        if (factor === 0) continue;
        for (let col = pivot; col <= size; col += 1) augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
    return augmented.map((row) => row[size]);
  }

  function steadyState(matrix) {
    const size = matrix.length;
    const system = matrix.map((row) => [...row]);
    system[size - 1] = Array(size).fill(1);
    const rhs = Array(size).fill(0);
    rhs[size - 1] = 1;
    return renormalize(solveLinearSystem(system, rhs));
  }

  function plSignal(params, population, pairInfo) {
    let pairEmission = 0;
    pairInfo.eigenstates.forEach((eigenstate, idx) => {
      pairEmission += params.kRecSingletToS1 * eigenstate.wS * population[stateIndex[`P${idx}`]];
    });
    return params.kRad * population[stateIndex.S1] + params.brightPairYield * pairEmission;
  }

  function simulateTraceFromInitial(params, mwEnabled, initialPopulation, sample = {
    hyperfineALong_MHz: 0,
    hyperfineATrans_MHz: 0,
    hyperfineBLong_MHz: 0,
    hyperfineBTrans_MHz: 0,
  }, mwFrequencyMHz = params.odmrCenter) {
    const built = buildRateMatrix(params, mwFrequencyMHz, mwEnabled, sample);
    const duration = Math.max(1, params.traceDuration);
    const points = Math.max(30, Math.round(params.tracePoints));
    const sampleDt = duration / (points - 1);
    const maxRate = Math.max(1e-6, ...built.matrix.flat().map((value) => Math.abs(value)));
    const dt = Math.min(sampleDt / 4, 0.04 / maxRate);
    const steps = Math.max(1, Math.ceil(sampleDt / dt));
    const subDt = sampleDt / steps;

    let population = [...initialPopulation];
    const trace = [];
    for (let point = 0; point < points; point += 1) {
      trace.push({ t: point * sampleDt, pl: plSignal(params, population, built.pair), population: [...population] });
      if (point === points - 1) continue;
      for (let step = 0; step < steps; step += 1) population = rk4Step(built.matrix, population, subDt);
    }
    return trace;
  }

  function simulateTrace(params, mwEnabled, sample = {
    hyperfineALong_MHz: 0,
    hyperfineATrans_MHz: 0,
    hyperfineBLong_MHz: 0,
    hyperfineBTrans_MHz: 0,
  }, mwFrequencyMHz = params.odmrCenter) {
    const initialPopulation = Array(states.length).fill(0);
    initialPopulation[stateIndex.S0] = 1;
    return simulateTraceFromInitial(params, mwEnabled, initialPopulation, sample, mwFrequencyMHz);
  }

  function toPopulationMap(population) {
    return Object.fromEntries(states.map((state, index) => [state, population[index]]));
  }

  function createSeededRng(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussianPair(seed) {
    const rng = createSeededRng(seed);
    let u1 = 0;
    let u2 = 0;
    while (u1 <= 1e-12) u1 = rng();
    while (u2 <= 1e-12) u2 = rng();
    const radius = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  }

  function ensembleRealizations(params) {
    const hasGeomDist = (params.pairDistanceSigmaNm || 0) > 0
      || (params.pairThetaSigmaDeg || 0) > 0
      || (params.pairExchangeSigmaMHz || 0) > 0;

    if (params.regimeMode !== "ensemble") {
      return [{
        hyperfineALong_MHz: params.hyperfineALong_MHz,
        hyperfineATrans_MHz: params.hyperfineATrans_MHz,
        hyperfineBLong_MHz: params.hyperfineBLong_MHz,
        hyperfineBTrans_MHz: params.hyperfineBTrans_MHz,
      }];
    }
    const count = Math.max(1, Math.round(params.ensembleSamples));
    const samples = [{ hyperfineALong_MHz: 0, hyperfineATrans_MHz: 0, hyperfineBLong_MHz: 0, hyperfineBTrans_MHz: 0 }];
    for (let i = 1; i < count; i += 1) {
      const [gaussALong, gaussATrans] = gaussianPair(24681357 + i * 7919);
      const [gaussBLong, gaussBTrans] = gaussianPair(97531864 + i * 6151);
      const sample = {
        hyperfineALong_MHz: gaussALong * params.hyperfineALong_MHz,
        hyperfineATrans_MHz: gaussATrans * params.hyperfineATrans_MHz,
        hyperfineBLong_MHz: gaussBLong * params.hyperfineBLong_MHz,
        hyperfineBTrans_MHz: gaussBTrans * params.hyperfineBTrans_MHz,
      };
      if (hasGeomDist) {
        const [gaussR, gaussTheta] = gaussianPair(13579246 + i * 8117);
        const [gaussJ] = gaussianPair(86420135 + i * 5393);
        if ((params.pairDistanceSigmaNm || 0) > 0) sample.pairDistanceNm = params.pairDistanceNm + gaussR * params.pairDistanceSigmaNm;
        if ((params.pairThetaSigmaDeg || 0) > 0) sample.pairThetaDeg = params.pairThetaDeg + gaussTheta * params.pairThetaSigmaDeg;
        if ((params.pairExchangeSigmaMHz || 0) > 0) sample.pairExchangeMHz = params.pairExchangeMHz + gaussJ * params.pairExchangeSigmaMHz;
      }
      samples.push(sample);
    }
    return samples;
  }

  function averagePopulationMaps(populationMaps) {
    return Object.fromEntries(states.map((state) => [
      state,
      populationMaps.reduce((sum, population) => sum + population[state], 0) / populationMaps.length,
    ]));
  }

  function averageTraces(traces) {
    return traces[0].map((point, index) => ({
      t: point.t,
      pl: traces.reduce((sum, trace) => sum + trace[index].pl, 0) / traces.length,
      population: states.map((_, stateIdx) => traces.reduce((sum, trace) => sum + trace[index].population[stateIdx], 0) / traces.length),
    }));
  }

  function buildOdmrSweep(params, plOff, samples) {
    const span = Math.max(1e-6, Math.abs(params.odmrSpan));
    const points = Math.max(21, Math.round(params.odmrPoints));
    const start = params.odmrCenter - span / 2;
    const step = span / (points - 1);
    const sweep = [];
    for (let i = 0; i < points; i += 1) {
      const freq = start + i * step;
      const sampleResults = samples.map((sample) => {
        const built = buildRateMatrix(params, freq, true, sample);
        const steady = steadyState(built.matrix);
        return { built, steady, pl: plSignal(params, steady, built.pair) };
      });
      const pl = sampleResults.reduce((sum, result) => sum + result.pl, 0) / sampleResults.length;
      const contrast = plOff === 0 ? 0 : ((plOff - pl) / plOff) * 100;
      sweep.push({
        freq,
        pl,
        contrast,
        mw: sampleResults[0].built.mw,
        pair: sampleResults[0].built.pair,
      });
    }
    return sweep;
  }

  // Pulsed ODMR: init laser → MW pulse at freq → laser readout.
  // Reference per freq: init laser → dark (same duration as MW pulse) → laser readout.
  // The init population is the same for every freq point, so we compute it once per sample.
  function buildPulsedOdmrSweep(params, samples) {
    const span = Math.max(1e-6, Math.abs(params.odmrSpan));
    const points = Math.max(21, Math.round(params.odmrPoints));
    const start = params.odmrCenter - span / 2;
    const stepFreq = span / (points - 1);
    const initDur = Math.max(0.1, params.initDuration || 5);
    const mwDur = Math.max(0.01, params.mwPulseDuration || 2);
    const readDur = Math.max(0.01, params.readDuration || 0.5);
    const groundPop = Array(states.length).fill(0);
    groundPop[stateIndex.S0] = 1;

    // Pre-compute init pop and reference PL for each sample.
    const sampleCache = samples.map((sample) => {
      const { finalPop: initPop } = runPulse(params, true, false, params.odmrCenter, groundPop, initDur, sample);
      const { finalPop: darkPop } = runPulse(params, false, false, params.odmrCenter, initPop, mwDur, sample);
      const { integratedPL: plRef } = runPulse(params, true, false, params.odmrCenter, darkPop, readDur, sample);
      return { sample, initPop, plRef };
    });

    const sweep = [];
    for (let i = 0; i < points; i += 1) {
      const freq = start + i * stepFreq;
      const samplePLs = sampleCache.map(({ sample, initPop, plRef }) => {
        const { finalPop: afterMW } = runPulse(params, false, true, freq, initPop, mwDur, sample);
        const { integratedPL: plRead } = runPulse(params, true, false, freq, afterMW, readDur, sample);
        return { plRead, plRef };
      });
      const pl = samplePLs.reduce((s, r) => s + r.plRead, 0) / samplePLs.length;
      const plRef = samplePLs.reduce((s, r) => s + r.plRef, 0) / samplePLs.length;
      sweep.push({ freq, pl, plRef, contrast: plRef === 0 ? 0 : ((plRef - pl) / plRef) * 100 });
    }
    return sweep;
  }

  // Rabi-style curve: init laser → MW pulse (variable duration) → laser readout.
  // Rate-equation model → exponential spin-state transfer, no coherent oscillations.
  function buildRabiCurve(params, samples, peakFreqMHz) {
    const rabiMax = Math.max(0.01, params.rabiMaxDuration || 5);
    const rabiPts = Math.max(11, Math.round(params.rabiPoints || 61));
    const initDur = Math.max(0.1, params.initDuration || 5);
    const readDur = Math.max(0.01, params.readDuration || 0.5);
    const groundPop = Array(states.length).fill(0);
    groundPop[stateIndex.S0] = 1;

    const sampleCache = samples.map((sample) => {
      const { finalPop: initPop } = runPulse(params, true, false, peakFreqMHz, groundPop, initDur, sample);
      const { integratedPL: plRef } = runPulse(params, true, false, peakFreqMHz, initPop, readDur, sample);
      return { sample, initPop, plRef };
    });

    const curve = [];
    for (let i = 0; i < rabiPts; i += 1) {
      const tMw = (rabiMax * i) / (rabiPts - 1);
      const samplePLs = sampleCache.map(({ sample, initPop, plRef }) => {
        const { finalPop: afterMW } = runPulse(params, false, true, peakFreqMHz, initPop, tMw, sample);
        const { integratedPL: plRead } = runPulse(params, true, false, peakFreqMHz, afterMW, readDur, sample);
        return { plRead, plRef };
      });
      const pl = samplePLs.reduce((s, r) => s + r.plRead, 0) / samplePLs.length;
      const plRef = samplePLs.reduce((s, r) => s + r.plRef, 0) / samplePLs.length;
      curve.push({ tMw, pl, plRef, contrast: plRef === 0 ? 0 : ((plRef - pl) / plRef) * 100 });
    }
    return curve;
  }

  // T1 decay: init laser → dark (variable duration, no laser, no MW) → laser readout.
  // Shows how spin-polarized population relaxes back toward dark equilibrium.
  function buildT1Curve(params, samples) {
    const t1Max = Math.max(0.1, params.t1MaxDuration || 50);
    const t1Pts = Math.max(11, Math.round(params.t1Points || 41));
    const initDur = Math.max(0.1, params.initDuration || 5);
    const readDur = Math.max(0.01, params.readDuration || 0.5);
    const groundPop = Array(states.length).fill(0);
    groundPop[stateIndex.S0] = 1;

    const sampleCache = samples.map((sample) => {
      const { finalPop: initPop } = runPulse(params, true, false, params.odmrCenter, groundPop, initDur, sample);
      const { integratedPL: plRef } = runPulse(params, true, false, params.odmrCenter, initPop, readDur, sample);
      return { sample, initPop, plRef };
    });

    const curve = [];
    for (let i = 0; i < t1Pts; i += 1) {
      const tDark = (t1Max * i) / (t1Pts - 1);
      const samplePLs = sampleCache.map(({ sample, initPop, plRef }) => {
        const { finalPop: afterDark } = runPulse(params, false, false, params.odmrCenter, initPop, tDark, sample);
        const { integratedPL: plRead } = runPulse(params, true, false, params.odmrCenter, afterDark, readDur, sample);
        return { plRead, plRef };
      });
      const pl = samplePLs.reduce((s, r) => s + r.plRead, 0) / samplePLs.length;
      const plRef = samplePLs.reduce((s, r) => s + r.plRef, 0) / samplePLs.length;
      curve.push({ tDark, pl, plRef });
    }
    return curve;
  }

  function pickPeakFrequency(sweep, fallback) {
    if (!sweep.length) return fallback;
    let best = sweep[0];
    for (let i = 1; i < sweep.length; i += 1) {
      if (Math.abs(sweep[i].contrast) > Math.abs(best.contrast)) best = sweep[i];
    }
    return best.freq;
  }

  function runModel(rawParams) {
    const params = { ...defaultParams, ...rawParams };
    const samples = ensembleRealizations(params);
    const offRuns = samples.map((sample) => {
      const built = buildRateMatrix(params, params.odmrCenter, false, sample);
      const steady = steadyState(built.matrix);
      return {
        built,
        steady: toPopulationMap(steady),
        pl: plSignal(params, steady, built.pair),
        trace: simulateTrace(params, false, sample),
      };
    });
    const plOff = offRuns.reduce((sum, run) => sum + run.pl, 0) / offRuns.length;
    const odmrSweep = buildOdmrSweep(params, plOff, samples);
    const peakFrequencyMHz = pickPeakFrequency(odmrSweep, params.odmrCenter);

    const onRuns = samples.map((sample) => {
      const built = buildRateMatrix(params, peakFrequencyMHz, true, sample);
      const steady = steadyState(built.matrix);
      return {
        built,
        steady: toPopulationMap(steady),
        pl: plSignal(params, steady, built.pair),
        trace: simulateTrace(params, true, sample, peakFrequencyMHz),
      };
    });
    const plOn = onRuns.reduce((sum, run) => sum + run.pl, 0) / onRuns.length;
    const representativeOn = onRuns[0];

    const pulsedOdmrSweep = buildPulsedOdmrSweep(params, samples);
    const rabiCurve = buildRabiCurve(params, samples, peakFrequencyMHz);
    const t1Curve = buildT1Curve(params, samples);

    return {
      params,
      states,
      stateLabels,
      sections: parameterSections,
      off: {
        steady: averagePopulationMaps(offRuns.map((run) => run.steady)),
        pl: plOff,
        trace: averageTraces(offRuns.map((run) => run.trace)),
      },
      on: {
        steady: averagePopulationMaps(onRuns.map((run) => run.steady)),
        pl: plOn,
        trace: averageTraces(onRuns.map((run) => run.trace)),
      },
      pair: representativeOn.built.pair,
      localTriplet: representativeOn.built.localTriplet,
      defectResonances: representativeOn.built.mw.defect,
      mwOnPeak: representativeOn.built.mw,
      peakFrequencyMHz,
      odmr: {
        sweep: odmrSweep,
      },
      pulsed: {
        odmrSweep: pulsedOdmrSweep,
        rabi: rabiCurve,
        t1: t1Curve,
      },
      ensembleCount: samples.length,
      contrast: plOff === 0 ? 0 : ((plOff - plOn) / plOff) * 100,
    };
  }

  return {
    states,
    stateLabels,
    defaultParams,
    presets: { realistic: realisticPreset, positive: positivePreset },
    parameterSections,
    parameterHelp,
    runModel,
  };
})();

(function initSpinPairSimulator() {
  try {
  const storageKey = "spin-pair-simulator-user-defaults-v1";
  const root = document.querySelector("[data-spin-pair-simulator]");
  if (!root || !window.HTMLCanvasElement) return;

  const form = root.querySelector("[data-role='controls']");
  const metrics = root.querySelector("[data-role='metrics']");
  const tableBody = root.querySelector("[data-role='population-table']");
  const traceCanvas = root.querySelector("[data-role='trace-canvas']");
  const barsCanvas = root.querySelector("[data-role='bars-canvas']");
  const odmrCanvas = root.querySelector("[data-role='odmr-canvas']");
  const scanCanvas = root.querySelector("[data-role='scan-canvas']");
  const scanMode = root.querySelector("[data-role='scan-mode']");
  const scanParam = root.querySelector("[data-role='scan-param']");
  const scanStart = root.querySelector("[data-role='scan-start']");
  const scanEnd = root.querySelector("[data-role='scan-end']");
  const scanPoints = root.querySelector("[data-role='scan-points']");
  const scanParamY = root.querySelector("[data-role='scan-param-y']");
  const scanStartY = root.querySelector("[data-role='scan-start-y']");
  const scanEndY = root.querySelector("[data-role='scan-end-y']");
  const scanPointsY = root.querySelector("[data-role='scan-points-y']");
  const lifetimes = root.querySelector("[data-role='lifetimes']");
  const summary = root.querySelector("[data-role='summary']");
  const pulsedOdmrCanvas = root.querySelector("[data-role='pulsed-odmr-canvas']");
  const rabiCanvas = root.querySelector("[data-role='rabi-canvas']");
  const t1Canvas = root.querySelector("[data-role='t1-canvas']");
  const exportText = root.querySelector("[data-role='export-text']");
  const resetButton = document.getElementById("sim-reset");
  const zeroAllButton = document.getElementById("sim-zero-all");
  const exportParamsButton = document.getElementById("sim-export-params");
  const saveDefaultsButton = document.getElementById("sim-save-defaults");
  const regimeMode = root.querySelector("[data-role='regime-mode']");
  const presetSelect = root.querySelector("[data-role='preset-select']");
  const energyMode = root.querySelector("[data-role='energy-mode']");
  const energyDiagram = root.querySelector("[data-role='energy-diagram']");
  const energyInfo = root.querySelector("[data-role='energy-info']");
  const traceNote = root.querySelector("[data-role='trace-note']");
  const status = document.getElementById("sim-status");

  let lastResult = null;

  const baseNodePositions = {
    S1: { x: 120, y: 105 },
    S0: { x: 120, y: 555 },
    LTp: { x: 390, y: 175 },
    LT0: { x: 390, y: 270 },
    LTm: { x: 390, y: 365 },
    P0: { x: 850, y: 145 },
    P1: { x: 850, y: 255 },
    P2: { x: 850, y: 365 },
    P3: { x: 850, y: 475 },
  };

  function buildControls() {
    SpinPairSimulator.parameterSections.forEach((section, index) => {
      const group = document.createElement("details");
      group.className = "sim-group";
      if (index < 2) group.open = true;

      const summaryNode = document.createElement("summary");
      summaryNode.textContent = section.title;
      group.appendChild(summaryNode);

      const grid = document.createElement("div");
      grid.className = "sim-group-grid";
      section.items.forEach(([key, label, hint]) => {
        const wrapper = document.createElement("label");
        wrapper.className = "sim-control";
        const help = SpinPairSimulator.parameterHelp[key] || hint;
        const head = document.createElement("span");
        head.className = "sim-control-head";

        const title = document.createElement("span");
        title.textContent = label;

        const infoButton = document.createElement("button");
        infoButton.type = "button";
        infoButton.className = "sim-info-button";
        infoButton.setAttribute("data-role", "param-info-button");
        infoButton.setAttribute("aria-label", `Explain parameter ${label}`);
        infoButton.textContent = "i";

        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.01";
        input.name = key;
        input.value = SpinPairSimulator.defaultParams[key];
        if (key === "tracePoints" || key === "odmrPoints" || key === "ensembleSamples" || key === "rabiPoints" || key === "t1Points") input.step = "1";

        const small = document.createElement("small");
        small.textContent = hint;

        const popover = document.createElement("div");
        popover.className = "sim-info-popover";
        popover.hidden = true;
        popover.textContent = help;

        head.append(title, infoButton);
        wrapper.append(head, input, small, popover);
        grid.appendChild(wrapper);
      });

      group.appendChild(grid);
      form.appendChild(group);
    });
  }

  function readParams() {
    const values = {};
    new FormData(form).forEach((value, key) => {
      values[key] = Number(value);
    });
    values.regimeMode = regimeMode ? regimeMode.value : SpinPairSimulator.defaultParams.regimeMode;
    return values;
  }

  function writeParams(values) {
    if (regimeMode && Object.prototype.hasOwnProperty.call(values, "regimeMode")) regimeMode.value = values.regimeMode;
    form.querySelectorAll("input").forEach((input) => {
      if (Object.prototype.hasOwnProperty.call(values, input.name)) input.value = values[input.name];
    });
  }

  function applyPreset(values, message) {
    writeParams(values);
    render();
    if (exportText) exportText.value = buildExportPayload();
    const applied = readParams();
    setStatusMessage(
      `${message} Applied: r=${applied.pairDistanceNm.toFixed(2)} nm, J=${applied.pairExchangeMHz.toFixed(2)} MHz, B0=${applied.biasFieldmT.toFixed(2)} mT.`
    );
  }

  function applyNamedPreset(name) {
    const presetMap = {
      realistic: { data: SpinPairSimulator.presets.realistic, message: "Loaded realistic baseline." },
      positive: { data: SpinPairSimulator.presets.positive, message: "Loaded positive-contrast preset." },
    };
    const entry = presetMap[name];
    if (!entry) return;
    applyPreset(entry.data, entry.message);
    if (presetSelect) presetSelect.value = name;
  }

  function buildExportPayload() {
    return JSON.stringify(readParams(), null, 2);
  }

  function closeAllParamInfo() {
    root.querySelectorAll(".sim-info-popover").forEach((node) => {
      node.hidden = true;
      node.style.left = "";
      node.style.top = "";
    });
    root.querySelectorAll(".sim-info-button").forEach((button) => {
      button.setAttribute("aria-expanded", "false");
    });
  }

  async function exportCurrentParams() {
    const payload = buildExportPayload();
    if (exportText) exportText.value = payload;
    try {
      await navigator.clipboard.writeText(payload);
      if (status) {
        status.classList.remove("error");
        status.textContent = "Current parameters exported and copied to clipboard.";
      }
    } catch {
      if (status) {
        status.classList.remove("error");
        status.textContent = "Current parameters exported. Copy the JSON block from the panel.";
      }
    }
  }

  function loadStoredDefaults() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveCurrentAsDefaults() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(readParams()));
      if (status) {
        status.classList.remove("error");
        status.textContent = "Current parameters saved as your browser defaults.";
      }
    } catch (error) {
      if (status) {
        status.classList.add("error");
        status.textContent = `Could not save defaults: ${error.message}`;
      }
    }
  }

  function setStatusMessage(message, isError = false) {
    if (!status) return;
    status.classList.toggle("error", isError);
    status.textContent = message;
  }

  function formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
  }

  function pairDominantCharacter(eigenstate) {
    const components = [
      { key: "S", value: eigenstate.wS },
      { key: "T+", value: eigenstate.wTp },
      { key: "T0", value: eigenstate.wT0 },
      { key: "T-", value: eigenstate.wTm },
    ];
    return components.sort((a, b) => b.value - a.value)[0];
  }

  function pairStateDisplayName(index, eigenstate, compact = false) {
    const dominant = pairDominantCharacter(eigenstate);
    return compact
      ? `psi${index}~${dominant.key}`
      : `psi${index} (${dominant.key}-like)`;
  }

  function localTripletDominantCharacter(eigenstate) {
    const components = [
      { key: "T+", value: eigenstate.wTp },
      { key: "T0", value: eigenstate.wT0 },
      { key: "T-", value: eigenstate.wTm },
    ];
    return components.sort((a, b) => b.value - a.value)[0];
  }

  function localTripletStateDisplayName(index, eigenstate, compact = false) {
    const dominant = localTripletDominantCharacter(eigenstate);
    return compact
      ? `tau${index}~${dominant.key}`
      : `tau${index} (${dominant.key}-like)`;
  }

  function levelLabelPlacement(state, pos) {
    if (state === "S0" || state === "S1") {
      return { x: pos.x + 84, y: pos.y + 4, anchor: "start", popX: pos.x - 84, popAnchor: "end" };
    }
    if (state.startsWith("LT")) {
      return { x: pos.x - 86, y: pos.y + 4, anchor: "end", popX: pos.x + 86, popAnchor: "start" };
    }
    return { x: pos.x + 96, y: pos.y + 4, anchor: "start", popX: pos.x - 96, popAnchor: "end" };
  }

  function levelPositions(result) {
    const positions = JSON.parse(JSON.stringify(baseNodePositions));
    const tripletEnergies = result.localTriplet.eigenstates.map((state) => state.energy);
    const tripletMean = tripletEnergies.reduce((sum, value) => sum + value, 0) / tripletEnergies.length;
    // Use the actual spread of the three triplet eigenenergies as the display scale so that
    // Zeeman splitting is always visible even when ZFS >> Zeeman (D >> gamma*B0).
    const tripletSpread = Math.max(...tripletEnergies) - Math.min(...tripletEnergies);
    const tripletScaleMHz = Math.max(5, tripletSpread / 1.5);
    ["LTp", "LT0", "LTm"].forEach((label, index) => {
      const scaled = Math.tanh((tripletEnergies[index] - tripletMean) / tripletScaleMHz);
      positions[label].y = 270 - 110 * scaled;
    });

    const energies = result.pair.eigenstates.map((state) => state.energy);
    const meanE = energies.reduce((sum, value) => sum + value, 0) / energies.length;
    const avgGamma = 0.5 * (Math.abs(result.pair.gamma1) + Math.abs(result.pair.gamma2));
    const displayScaleMHz = Math.max(
      12,
      avgGamma * Math.abs(result.params.biasFieldmT) + Math.abs(result.params.pairExchangeMHz) + 8
    );
    const pairCenterY = 305;
    const pairHalfSpanPx = 150;
    result.pair.eigenstates.forEach((state, index) => {
      const label = `P${index}`;
      const scaled = Math.tanh((state.energy - meanE) / displayScaleMHz);
      positions[label].y = pairCenterY - pairHalfSpanPx * scaled;
    });
    return positions;
  }

  function transitionList(result, mwOn) {
    const params = result.params;
    const list = [
      { from: "S0", to: "S1", rate: params.kExc, label: "Laser" },
      { from: "S1", to: "S0", rate: params.kRad + params.kNonRad, label: "PL / non-rad" },
      { from: "S1", to: "LTp", rate: params.kISC * result.localTriplet.eigenstates[0].iscWeight, label: "ISC" },
      { from: "S1", to: "LT0", rate: params.kISC * result.localTriplet.eigenstates[1].iscWeight, label: "ISC" },
      { from: "S1", to: "LTm", rate: params.kISC * result.localTriplet.eigenstates[2].iscWeight, label: "ISC" },
      { from: "LTp", to: "S0", rate: params.kTripletToSinglet * result.localTriplet.eigenstates[0].singletRateWeight, label: "triplet -> S0" },
      { from: "LT0", to: "S0", rate: params.kTripletToSinglet * result.localTriplet.eigenstates[1].singletRateWeight, label: "triplet -> S0" },
      { from: "LTm", to: "S0", rate: params.kTripletToSinglet * result.localTriplet.eigenstates[2].singletRateWeight, label: "triplet -> S0" },
    ];

    result.pair.eigenstates.forEach((state, index) => {
      const label = `P${index}`;
      list.push({ from: "S1", to: label, rate: params.kCrtSinglet * state.wS, label: "k_crt^S" });
      list.push({ from: "LTp", to: label, rate: params.kCrtTriplet * state.wTp, label: "k_crt^T" });
      list.push({ from: "LT0", to: label, rate: params.kCrtTriplet * state.wT0, label: "k_crt^T" });
      list.push({ from: "LTm", to: label, rate: params.kCrtTriplet * state.wTm, label: "k_crt^T" });
      list.push({ from: label, to: "S1", rate: params.kRecSingletToS1 * state.wS, label: "k_rec^S -> S1" });
      list.push({ from: label, to: "S0", rate: params.kRecSingletToS0 * state.wS, label: "k_rec^S -> S0" });
      list.push({ from: label, to: "LTp", rate: params.kRecTriplet * state.wTp, label: "k_rec^T" });
      list.push({ from: label, to: "LT0", rate: params.kRecTriplet * state.wT0, label: "k_rec^T" });
      list.push({ from: label, to: "LTm", rate: params.kRecTriplet * state.wTm, label: "k_rec^T" });
    });

    [["LTp", "LT0"], ["LTp", "LTm"], ["LT0", "LTm"]].forEach(([from, to]) => {
      list.push({ from, to, rate: params.kTripletSpinRelax, label: "local triplet relaxation" });
    });
    // Show pair T1 relaxation arrows when non-zero.
    if (params.kPairSpinRelax > 0) {
      [["P0", "P1"], ["P1", "P2"], ["P2", "P3"]].forEach(([from, to]) => {
        list.push({ from, to, rate: params.kPairSpinRelax, label: "pair spin relaxation" });
      });
    }
    // Show pair dissociation when non-zero.
    if (params.kPairDiss > 0) {
      ["P0", "P1", "P2", "P3"].forEach((state) => {
        list.push({ from: state, to: "S0", rate: params.kPairDiss, label: "pair dissociation" });
      });
    }
    if (mwOn && result.mwOnPeak) {
      result.mwOnPeak.tripletTransitions.forEach((transition) => {
        list.push({ from: ["LTp", "LT0", "LTm"][transition.from], to: ["LTp", "LT0", "LTm"][transition.to], rate: transition.rate, label: "local triplet MW transition" });
      });
      result.mwOnPeak.pairTransitions.forEach((transition) => {
        list.push({ from: `P${transition.from}`, to: `P${transition.to}`, rate: transition.rate, label: "pair MW transition" });
      });
    }

    return list.filter((item) => item.rate > 1e-8);
  }

  function arrowPath(from, to, positions) {
    const p1 = positions[from];
    const p2 = positions[to];
    if (!p1 || !p2) return "";
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const norm = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / norm;
    const uy = dy / norm;
    const startX = p1.x + ux * 20;
    const startY = p1.y + uy * 20;
    const endX = p2.x - ux * 22;
    const endY = p2.y - uy * 22;
    const curve = Math.min(60, Math.abs(dx) * 0.08 + Math.abs(dy) * 0.05);
    const cx = (startX + endX) / 2 - uy * curve;
    const cy = (startY + endY) / 2 + ux * curve;
    return `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
  }

  function transitionStyle(label) {
    if (label === "Laser") return { stroke: "#65a30d", text: "#4d7c0f" };
    if (label === "PL / non-rad") return { stroke: "#dc2626", text: "#b91c1c" };
    if (label === "ISC") return { stroke: "#6b7280", text: "#4b5563" };
    if (label === "k_crt^S") return { stroke: "#0ea5e9", text: "#0369a1" };
    if (label === "k_crt^T") return { stroke: "#2563eb", text: "#1d4ed8" };
    if (label === "k_rec^S -> S1") return { stroke: "#f97316", text: "#c2410c" };
    if (label === "k_rec^S -> S0") return { stroke: "#fb7185", text: "#be123c" };
    if (label === "k_rec^T") return { stroke: "#7c3aed", text: "#6d28d9" };
    if (label === "triplet -> S0") return { stroke: "#a16207", text: "#92400e" };
    if (label === "local triplet relaxation") return { stroke: "#475569", text: "#334155" };
    if (label === "pair spin relaxation") return { stroke: "#64748b", text: "#475569" };
    if (label === "pair dissociation") return { stroke: "#ef4444", text: "#dc2626" };
    if (label === "local triplet MW transition") return { stroke: "#0891b2", text: "#0e7490" };
    if (label === "pair MW transition") return { stroke: "#14b8a6", text: "#0f766e" };
    return { stroke: "#0f172a", text: "#334155" };
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width > 10 ? rect.width : canvas.clientWidth || Number(canvas.getAttribute("width")) || 640;
    const cssHeight = rect.height > 10 ? rect.height : canvas.clientHeight || Number(canvas.getAttribute("height")) || 280;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    return { ctx, width: cssWidth, height: cssHeight };
  }

  function drawAxes(ctx, width, height, left, bottom) {
    ctx.strokeStyle = "rgba(148,163,184,0.18)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i += 1) {
      const y = 12 + ((height - bottom - 12) * i) / 5;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(width - 12, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(12,13,16,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, 12);
    ctx.lineTo(left, height - bottom);
    ctx.lineTo(width - 12, height - bottom);
    ctx.stroke();
  }

  function updateMetrics(result) {
    const singletPairPopulation = result.off.steady.P0 * result.pair.eigenstates[0].wS
      + result.off.steady.P1 * result.pair.eigenstates[1].wS
      + result.off.steady.P2 * result.pair.eigenstates[2].wS
      + result.off.steady.P3 * result.pair.eigenstates[3].wS;

    metrics.innerHTML = `
      <div class="sim-metric">
        <strong>${result.off.pl.toFixed(4)}</strong>
        <span>PL off resonance</span>
      </div>
      <div class="sim-metric">
        <strong>${result.on.pl.toFixed(4)}</strong>
        <span>PL at ODMR peak = ${result.peakFrequencyMHz.toFixed(1)} MHz</span>
      </div>
      <div class="sim-metric">
        <strong>${result.contrast.toFixed(3)}%</strong>
        <span>ODMR contrast</span>
      </div>
      <div class="sim-metric">
        <strong>${formatPercent(singletPairPopulation)}</strong>
        <span>Singlet content in pair sector</span>
      </div>
    `;
  }

  function updateTable(result) {
    tableBody.innerHTML = "";
    SpinPairSimulator.states.forEach((state) => {
      let label = SpinPairSimulator.stateLabels[state];
      if (state.startsWith("LT")) {
        const idx = ["LTp", "LT0", "LTm"].indexOf(state);
        const eig = result.localTriplet.eigenstates[idx];
        label = `${localTripletStateDisplayName(idx, eig)} (wT+=${eig.wTp.toFixed(2)}, wT0=${eig.wT0.toFixed(2)}, wT-=${eig.wTm.toFixed(2)}, kS=${eig.singletRateWeight.toFixed(2)})`;
      }
      if (state.startsWith("P")) {
        const idx = Number(state.slice(1));
        const eig = result.pair.eigenstates[idx];
        label = `${pairStateDisplayName(idx, eig)} (wS=${eig.wS.toFixed(2)}, wT+=${eig.wTp.toFixed(2)}, wT0=${eig.wT0.toFixed(2)}, wT-=${eig.wTm.toFixed(2)})`;
      }
      const row = document.createElement("tr");
      row.innerHTML = `
        <th scope="row">${label}</th>
        <td>${formatPercent(result.off.steady[state])}</td>
        <td>${formatPercent(result.on.steady[state])}</td>
        <td>${formatPercent(result.on.steady[state] - result.off.steady[state])}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function inverseLifetime(rate) {
    return rate > 0 ? (1 / rate).toFixed(3) : "inf";
  }

  function updateLifetimes(result) {
    if (!lifetimes) return;
    const params = result.params;
    lifetimes.innerHTML = `
      <h3>Characteristic Lifetimes</h3>
      <p class="muted">Kinetic rates are interpreted as <strong>us^-1</strong>, so each characteristic lifetime is <strong>tau = 1 / k</strong> in microseconds.</p>
      <div class="sim-table-wrap">
        <table class="sim-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Rate (us^-1)</th>
              <th>Lifetime tau (us)</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row">Radiative decay</th><td>${params.kRad.toFixed(4)}</td><td>${inverseLifetime(params.kRad)}</td></tr>
            <tr><th scope="row">Non-radiative decay</th><td>${params.kNonRad.toFixed(4)}</td><td>${inverseLifetime(params.kNonRad)}</td></tr>
            <tr><th scope="row">ISC</th><td>${params.kISC.toFixed(4)}</td><td>${inverseLifetime(params.kISC)}</td></tr>
            <tr><th scope="row">Triplet -> S0</th><td>${params.kTripletToSinglet.toFixed(4)}</td><td>${inverseLifetime(params.kTripletToSinglet)}</td></tr>
            <tr><th scope="row">Triplet spin relaxation</th><td>${params.kTripletSpinRelax.toFixed(4)}</td><td>${inverseLifetime(params.kTripletSpinRelax)}</td></tr>
            <tr><th scope="row">k_crt^S</th><td>${params.kCrtSinglet.toFixed(4)}</td><td>${inverseLifetime(params.kCrtSinglet)}</td></tr>
            <tr><th scope="row">k_crt^T</th><td>${params.kCrtTriplet.toFixed(4)}</td><td>${inverseLifetime(params.kCrtTriplet)}</td></tr>
            <tr><th scope="row">k_rec^S -> S1</th><td>${params.kRecSingletToS1.toFixed(4)}</td><td>${inverseLifetime(params.kRecSingletToS1)}</td></tr>
            <tr><th scope="row">k_rec^S -> S0</th><td>${params.kRecSingletToS0.toFixed(4)}</td><td>${inverseLifetime(params.kRecSingletToS0)}</td></tr>
            <tr><th scope="row">k_rec^T</th><td>${params.kRecTriplet.toFixed(4)}</td><td>${inverseLifetime(params.kRecTriplet)}</td></tr>
            <tr><th scope="row">k_pair_relax (T1)</th><td>${params.kPairSpinRelax.toFixed(4)}</td><td>${inverseLifetime(params.kPairSpinRelax)}</td></tr>
            <tr><th scope="row">k_pair_diss</th><td>${params.kPairDiss.toFixed(4)}</td><td>${inverseLifetime(params.kPairDiss)}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function updateEnergyDiagram(result) {
    if (!energyDiagram) return;
    const mode = energyMode ? energyMode.value : "off";
    const positions = levelPositions(result);
    const steady = mode === "on" ? result.on.steady : result.off.steady;
    const transitions = transitionList(result, mode === "on");
    const maxRate = Math.max(1e-9, ...transitions.map((item) => item.rate));
    const maxPop = Math.max(1e-9, ...SpinPairSimulator.states.map((state) => steady[state]));

    const levels = SpinPairSimulator.states.map((state) => {
      const pos = positions[state];
      if (!pos) return "";
      const p = steady[state];
      const stroke = state.startsWith("P")
        ? `hsla(34, 88%, ${52 - Math.min(18, p * 140)}%, 0.95)`
        : state.startsWith("LT")
          ? `hsla(217, 78%, ${48 - Math.min(16, p * 140)}%, 0.95)`
          : `hsla(172, 82%, ${42 - Math.min(14, p * 140)}%, 0.95)`;
      const levelWidth = state.startsWith("P") ? 124 : 104;
      const levelThickness = 2 + 12 * Math.sqrt(p / maxPop);
      const label = state.startsWith("P")
        ? pairStateDisplayName(Number(state.slice(1)), result.pair.eigenstates[Number(state.slice(1))], true)
        : state.startsWith("LT")
          ? localTripletStateDisplayName(["LTp", "LT0", "LTm"].indexOf(state), result.localTriplet.eigenstates[["LTp", "LT0", "LTm"].indexOf(state)], true)
          : state;
      const placement = levelLabelPlacement(state, pos);
      let info = `${SpinPairSimulator.stateLabels[state]} | population (${mode}): ${(p * 100).toFixed(2)}%`;
      if (state.startsWith("LT")) {
        const idx = ["LTp", "LT0", "LTm"].indexOf(state);
        const eig = result.localTriplet.eigenstates[idx];
        info = `${localTripletStateDisplayName(idx, eig)} | population (${mode}): ${(p * 100).toFixed(2)}% | E=${eig.energy.toFixed(2)} MHz | wT+=${eig.wTp.toFixed(3)} | wT0=${eig.wT0.toFixed(3)} | wT-=${eig.wTm.toFixed(3)} | ISC=${eig.iscWeight.toFixed(3)} | kS=${eig.singletRateWeight.toFixed(3)}`;
      }
      if (state.startsWith("P")) {
        const idx = Number(state.slice(1));
        const eig = result.pair.eigenstates[idx];
        info = `${pairStateDisplayName(idx, eig)} | population (${mode}): ${(p * 100).toFixed(2)}% | E=${eig.energy.toFixed(2)} MHz | wS=${eig.wS.toFixed(3)} | wT+=${eig.wTp.toFixed(3)} | wT0=${eig.wT0.toFixed(3)} | wT-=${eig.wTm.toFixed(3)}`;
      }
      return `
        <g data-info="${info}">
          <line x1="${pos.x - levelWidth / 2}" y1="${pos.y}" x2="${pos.x + levelWidth / 2}" y2="${pos.y}" stroke="${stroke}" stroke-width="${levelThickness.toFixed(2)}" stroke-linecap="round"></line>
          <line x1="${pos.x - levelWidth / 2}" y1="${pos.y}" x2="${pos.x + levelWidth / 2}" y2="${pos.y}" stroke="#0f172a" stroke-opacity="0.18" stroke-width="1.2" stroke-linecap="round"></line>
          <rect x="${placement.x + (placement.anchor === "end" ? -74 : -4)}" y="${placement.y - 11}" width="78" height="16" rx="5" fill="rgba(255,255,255,0.92)"></rect>
          <text x="${placement.x}" y="${placement.y}" text-anchor="${placement.anchor}" font-size="12" fill="#0f172a" font-weight="800">${label}</text>
          <rect x="${placement.popX + (placement.popAnchor === "end" ? -56 : -4)}" y="${placement.y - 11}" width="60" height="16" rx="5" fill="rgba(255,255,255,0.9)"></rect>
          <text x="${placement.popX}" y="${placement.y}" text-anchor="${placement.popAnchor}" font-size="11" fill="#334155" font-weight="700">${(p * 100).toFixed(2)}%</text>
        </g>
      `;
    }).join("");

    const arrows = transitions.map((transition) => {
      const width = 1 + 7 * Math.sqrt(transition.rate / maxRate);
      const alpha = 0.28 + 0.72 * Math.sqrt(transition.rate / maxRate);
      const path = arrowPath(transition.from, transition.to, positions);
      const style = transitionStyle(transition.label);
      const labelX = (positions[transition.from].x + positions[transition.to].x) / 2;
      const labelY = (positions[transition.from].y + positions[transition.to].y) / 2 - 12;
      return `
        <g data-info="${transition.label} | ${transition.from} -> ${transition.to} | rate (${mode}): ${transition.rate.toFixed(3)}">
          <path d="${path}" fill="none" stroke="${style.stroke}" stroke-opacity="${alpha.toFixed(3)}" stroke-width="${width.toFixed(2)}" marker-end="url(#arrow)"></path>
          <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="11" fill="${style.text}">${transition.rate.toFixed(3)}</text>
        </g>
      `;
    }).join("");

    energyDiagram.innerHTML = `
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L10,4 L0,8 z" fill="#0f172a"></path>
        </marker>
      </defs>
      <rect x="18" y="52" width="470" height="548" rx="20" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.18)"></rect>
      <rect x="548" y="52" width="410" height="548" rx="20" fill="rgba(161,98,7,0.08)" stroke="rgba(161,98,7,0.16)"></rect>
      <text x="252" y="38" text-anchor="middle" font-size="13" fill="#334155" font-weight="700">Defect A localized manifold</text>
      <text x="753" y="38" text-anchor="middle" font-size="13" fill="#334155" font-weight="700">Charge-separated pair eigenstates (A,B)</text>
      <rect x="700" y="500" width="230" height="78" rx="12" fill="rgba(255,255,255,0.86)" stroke="rgba(148,163,184,0.32)"></rect>
      <text x="718" y="523" font-size="11" fill="#4d7c0f" font-weight="700">green: laser</text>
      <text x="718" y="541" font-size="11" fill="#b91c1c" font-weight="700">red/orange: bright recombination</text>
      <text x="718" y="559" font-size="11" fill="#6d28d9" font-weight="700">violet: triplet return</text>
      <text x="718" y="577" font-size="11" fill="#0369a1" font-weight="700">blue: pair creation</text>
      ${arrows}
      ${levels}
    `;
  }

  function bindEnergyInteractions() {
    if (!energyDiagram || !energyInfo) return;
    energyDiagram.addEventListener("pointerover", (event) => {
      const target = event.target.closest("[data-info]");
      if (target) energyInfo.textContent = target.getAttribute("data-info");
    });
    energyDiagram.addEventListener("pointerleave", () => {
      if (!lastResult) return;
      energyInfo.textContent = `Showing ${energyMode && energyMode.value === "on" ? "MW on" : "MW off"} populations and rates from the same localized-defect / pair solver.`;
    });
  }

  function drawTrace(result) {
    const { ctx, width, height } = prepareCanvas(traceCanvas);
    const left = 44;
    const bottom = 34;
    drawAxes(ctx, width, height, left, bottom);

    const offTrace = result.off.trace;
    const onTrace = result.on.trace;
    const maxY = Math.max(1e-9, ...offTrace.map((p) => p.pl), ...onTrace.map((p) => p.pl));
    const maxT = offTrace[offTrace.length - 1].t || 1;
    const yFromPl = (pl) => height - bottom - ((height - bottom - 20) * pl) / maxY;

    // Keep all rendering inside the plot box.
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 0, width - left - 16, height - bottom);
    ctx.clip();

    // Fill the area between curves (low alpha) to make ~1% differences visible at a glance.
    // This must be drawn BEFORE the dashed overlay, otherwise it can visually "wash out" the dashes.
    ctx.fillStyle = "rgba(61,214,198,0.12)";
    ctx.beginPath();
    onTrace.forEach((point, index) => {
      const x = left + ((width - left - 16) * point.t) / maxT;
      const y = yFromPl(point.pl);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = offTrace.length - 1; i >= 0; i -= 1) {
      const point = offTrace[i];
      const x = left + ((width - left - 16) * point.t) / maxT;
      const y = yFromPl(point.pl);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#3dd6c6";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    onTrace.forEach((point, index) => {
      const x = left + ((width - left - 16) * point.t) / maxT;
      const y = yFromPl(point.pl);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // MW off dashed overlay drawn AFTER MW-on, with a light halo so it remains visible even at full overlap.
    ctx.lineCap = "round";
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    offTrace.forEach((point, index) => {
      const x = left + ((width - left - 16) * point.t) / maxT;
      const y = yFromPl(point.pl);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 4.2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(12,13,16,0.85)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    const delta = onTrace.map((point, index) => point.pl - offTrace[index].pl);
    const maxAbsDelta = Math.max(1e-9, ...delta.map((value) => Math.abs(value)));
    const offEnd = offTrace[offTrace.length - 1].pl;
    const onEnd = onTrace[onTrace.length - 1].pl;
    const endContrast = offEnd === 0 ? 0 : ((offEnd - onEnd) / offEnd) * 100;

    ctx.fillStyle = "rgba(12,13,16,0.7)";
    ctx.font = "12px sans-serif";
    ctx.fillText("PL transient", left, 12);
    ctx.fillText("MW off (dashed)", width - 160, 18);
    ctx.fillStyle = "#3dd6c6";
    ctx.fillText(`MW on @ peak ${result.peakFrequencyMHz.toFixed(1)} MHz`, width - 214, 34);
    ctx.fillStyle = "rgba(12,13,16,0.55)";
    ctx.fillText(`max |Delta PL| ${maxAbsDelta.toExponential(2)}`, width - 190, 50);
    ctx.fillText(`end contrast ${endContrast.toFixed(2)}%`, width - 168, 66);
    ctx.fillText(`${maxT.toFixed(1)}`, width - 28, height - 8);

    // Draw a small style legend sample so "dashed" is always visually obvious.
    const legendX0 = width - 72;
    const legendX1 = width - 16;
    const legendY = 16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 0, width - left - 16, height - bottom);
    ctx.clip();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(legendX0, legendY);
    ctx.lineTo(legendX1, legendY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(12,13,16,0.9)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(legendX0, legendY);
    ctx.lineTo(legendX1, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const startX = left;
    const endX = left + ((width - left - 16) * maxT) / maxT;
    ctx.fillStyle = "#0c0d10";
    ctx.beginPath();
    ctx.arc(startX, yFromPl(offTrace[0].pl), 2.6, 0, Math.PI * 2);
    ctx.arc(endX, yFromPl(offTrace[offTrace.length - 1].pl), 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3dd6c6";
    ctx.beginPath();
    ctx.arc(startX, yFromPl(onTrace[0].pl), 3, 0, Math.PI * 2);
    ctx.arc(endX, yFromPl(onTrace[onTrace.length - 1].pl), 3, 0, Math.PI * 2);
    ctx.fill();

    if (traceNote) {
      traceNote.textContent = `Time axis in microseconds. MW off and MW on use the same startup transient; MW on is evaluated at the strongest ODMR peak, fMW = ${result.peakFrequencyMHz.toFixed(1)} MHz.`;
    }

  }

  function drawBars(result) {
    const { ctx, width, height } = prepareCanvas(barsCanvas);
    const left = 44;
    const bottom = 48;
    drawAxes(ctx, width, height, left, bottom);

    const plotWidth = width - left - 16;
    const groupWidth = plotWidth / SpinPairSimulator.states.length;
    const barWidth = Math.min(18, groupWidth * 0.32);
    const maxY = Math.max(0.01, ...SpinPairSimulator.states.map((state) => result.off.steady[state]), ...SpinPairSimulator.states.map((state) => result.on.steady[state]));

    SpinPairSimulator.states.forEach((state, index) => {
      const center = left + groupWidth * index + groupWidth / 2;
      const xOff = center - barWidth - 3;
      const xOn = center + 3;
      const offHeight = ((height - bottom - 18) * result.off.steady[state]) / maxY;
      const onHeight = ((height - bottom - 18) * result.on.steady[state]) / maxY;
      ctx.fillStyle = "#0c0d10";
      ctx.fillRect(xOff, height - bottom - offHeight, barWidth, offHeight);
      ctx.fillStyle = "#3dd6c6";
      ctx.fillRect(xOn, height - bottom - onHeight, barWidth, onHeight);
      ctx.save();
      ctx.translate(center, height - 10);
      ctx.rotate(-0.55);
      ctx.fillStyle = "rgba(12,13,16,0.74)";
      ctx.font = "11px sans-serif";
      ctx.fillText(state, -10, 0);
      ctx.restore();
    });

    ctx.fillStyle = "rgba(12,13,16,0.7)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Steady-state populations", left, 12);
  }

  function drawOdmr(result) {
    const { ctx, width, height } = prepareCanvas(odmrCanvas);
    const left = 58;
    const bottom = 36;
    drawAxes(ctx, width, height, left, bottom);

    const sweep = result.odmr.sweep;
    const minF = sweep[0].freq;
    const maxF = sweep[sweep.length - 1].freq;
    const contrasts = sweep.map((point) => point.contrast);
    let minContrast = Math.min(...contrasts);
    let maxContrast = Math.max(...contrasts);
    if (Math.abs(maxContrast - minContrast) < 1e-9) {
      minContrast -= 0.5;
      maxContrast += 0.5;
    } else {
      const pad = 0.08 * (maxContrast - minContrast);
      minContrast -= pad;
      maxContrast += pad;
    }
    const yFromContrast = (contrast) => {
      const norm = (contrast - minContrast) / (maxContrast - minContrast);
      return height - bottom - (height - bottom - 20) * norm;
    };

    ctx.strokeStyle = "#0ea5a4";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    sweep.forEach((point, index) => {
      const x = left + ((width - left - 16) * (point.freq - minF)) / (maxF - minF || 1);
      const y = yFromContrast(point.contrast);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const centerPoint = sweep[Math.floor(sweep.length / 2)];
    const centerX = left + ((width - left - 16) * (centerPoint.freq - minF)) / (maxF - minF || 1);
    const centerY = yFromContrast(centerPoint.contrast);
    ctx.fillStyle = "#0f766e";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.2, 0, Math.PI * 2);
    ctx.fill();

    if (minContrast < 0 && maxContrast > 0) {
      const y0 = yFromContrast(0);
      ctx.strokeStyle = "rgba(15,23,42,0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(left, y0);
      ctx.lineTo(width - 12, y0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const localTransitions = result.localTriplet.transitions.slice(0, 3).map((transition) => ({
      value: transition.freq,
      label: `${localTripletStateDisplayName(transition.from, result.localTriplet.eigenstates[transition.from], true)}<->${localTripletStateDisplayName(transition.to, result.localTriplet.eigenstates[transition.to], true)}`,
    }));
    const pairTransitions = result.pair.transitions.slice(0, 4).map((transition) => ({
      value: transition.freq,
      label: `${pairStateDisplayName(transition.from, result.pair.eigenstates[transition.from], true)}<->${pairStateDisplayName(transition.to, result.pair.eigenstates[transition.to], true)}`,
    }));
    const markers = [
      ...localTransitions,
      ...pairTransitions,
    ];

    ctx.strokeStyle = "rgba(15,23,42,0.28)";
    ctx.setLineDash([5, 4]);
    markers.forEach((marker) => {
      if (marker.value < minF || marker.value > maxF) return;
      const x = left + ((width - left - 16) * (marker.value - minF)) / (maxF - minF || 1);
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x, height - bottom);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const visibleMarkers = markers.filter((marker) => marker.value >= minF && marker.value <= maxF);
    ctx.font = "11px sans-serif";
    visibleMarkers.forEach((marker, index) => {
      const x = left + ((width - left - 16) * (marker.value - minF)) / (maxF - minF || 1);
      let nearestIndex = 0;
      let nearestDistance = Math.abs(sweep[0].freq - marker.value);
      for (let i = 1; i < sweep.length; i += 1) {
        const distance = Math.abs(sweep[i].freq - marker.value);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      const anchorY = yFromContrast(sweep[nearestIndex].contrast);
      const labelYOffset = index % 2 === 0 ? -18 : 18;
      const labelY = Math.max(26, Math.min(height - bottom - 8, anchorY + labelYOffset));
      const labelWidth = Math.max(44, ctx.measureText(marker.label).width + 10);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillRect(x - labelWidth / 2, labelY - 10, labelWidth, 16);
      ctx.strokeStyle = "rgba(148,163,184,0.45)";
      ctx.strokeRect(x - labelWidth / 2, labelY - 10, labelWidth, 16);
      ctx.fillStyle = marker.label.startsWith("P") ? "#1d4ed8" : "#92400e";
      ctx.fillText(marker.label, x - labelWidth / 2 + 5, labelY + 2);
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.beginPath();
      ctx.moveTo(x, anchorY);
      ctx.lineTo(x, labelYOffset < 0 ? labelY + 6 : labelY - 12);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(12,13,16,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText("ODMR from localized triplet + pair eigenstate transitions", left, 12);
    ctx.fillText(`${maxContrast.toFixed(2)}%`, 12, 20);
    ctx.fillText(`${minContrast.toFixed(2)}%`, 12, height - bottom);
    ctx.fillText(`${minF.toFixed(1)} MHz`, left, height - 8);
    ctx.fillText(`${maxF.toFixed(1)} MHz`, width - 82, height - 8);
    ctx.fillText(`B0 = ${result.params.biasFieldmT.toFixed(2)} mT`, width - 150, 28);
  }

  function scanAxisLabel(param) {
    const labels = {
      pairDistanceNm: "Distance r (nm)",
      pairThetaDeg: "Angle theta (deg)",
      pairPhiDeg: "Angle phi (deg)",
      biasFieldmT: "Bias field B0 (mT)",
      pairExchangeMHz: "Exchange J (MHz)",
      kExc: "Laser excitation (us^-1)",
      kRad: "Radiative decay (us^-1)",
      kNonRad: "Non-radiative decay (us^-1)",
      kISC: "ISC rate (us^-1)",
      kTripletToSinglet: "Triplet -> S0 (us^-1)",
      kTripletSpinRelax: "Triplet spin relaxation (us^-1)",
      defectSocTpm: "SO coupling T±",
      defectSocT0: "SO coupling T0",
      defectVibronicWidthMHz: "Vibronic width (MHz)",
      kCrtSinglet: "k_crt^S (us^-1)",
      kCrtTriplet: "k_crt^T (us^-1)",
      kRecSingletToS1: "k_rec^S -> S1 (us^-1)",
      kRecSingletToS0: "k_rec^S -> S0 (us^-1)",
      kRecTriplet: "k_rec^T (us^-1)",
      kPairSpinRelax: "k_pair_relax (us^-1)",
      kPairDiss: "k_pair_diss (us^-1)",
      pairDistanceSigmaNm: "sigma_r (nm)",
      pairThetaSigmaDeg: "sigma_theta (deg)",
      pairExchangeSigmaMHz: "sigma_J (MHz)",
      brightPairYield: "Bright pair yield",
      hyperfineATrans_MHz: "A hyperfine trans. (MHz)",
      hyperfineBTrans_MHz: "B hyperfine trans. (MHz)",
      hyperfineALong_MHz: "A hyperfine long. (MHz)",
      hyperfineBLong_MHz: "B hyperfine long. (MHz)",
    };
    return labels[param] || param;
  }

  function buildContrastScan(params) {
    const parameter = scanParam ? scanParam.value : "pairDistanceNm";
    const start = scanStart ? Number(scanStart.value) : 1;
    const end = scanEnd ? Number(scanEnd.value) : 4;
    const points = Math.max(5, Math.round(scanPoints ? Number(scanPoints.value) : 31));
    const step = points > 1 ? (end - start) / (points - 1) : 0;
    const scan = [];
    for (let i = 0; i < points; i += 1) {
      const value = start + step * i;
      const scanResult = SpinPairSimulator.runModel({ ...params, [parameter]: value });
      scan.push({ x: value, contrast: scanResult.contrast });
    }
    return { parameter, scan, start, end };
  }

  function buildContrastHeatmap(params) {
    const xParam = scanParam ? scanParam.value : "pairDistanceNm";
    const yParam = scanParamY ? scanParamY.value : "pairThetaDeg";
    const xStart = scanStart ? Number(scanStart.value) : 1;
    const xEnd = scanEnd ? Number(scanEnd.value) : 4;
    const yStart = scanStartY ? Number(scanStartY.value) : 0;
    const yEnd = scanEndY ? Number(scanEndY.value) : 90;
    const xPoints = Math.max(4, Math.round(scanPoints ? Number(scanPoints.value) : 31));
    const yPoints = Math.max(4, Math.round(scanPointsY ? Number(scanPointsY.value) : 21));
    const xStep = xPoints > 1 ? (xEnd - xStart) / (xPoints - 1) : 0;
    const yStep = yPoints > 1 ? (yEnd - yStart) / (yPoints - 1) : 0;
    const values = [];
    for (let y = 0; y < yPoints; y += 1) {
      const row = [];
      for (let x = 0; x < xPoints; x += 1) {
        const scanResult = SpinPairSimulator.runModel({
          ...params,
          [xParam]: xStart + xStep * x,
          [yParam]: yStart + yStep * y,
        });
        row.push(scanResult.contrast);
      }
      values.push(row);
    }
    return { xParam, yParam, xStart, xEnd, yStart, yEnd, xPoints, yPoints, values };
  }

  function drawContrastScan(result) {
    if (!scanCanvas) return;
    const { ctx, width, height } = prepareCanvas(scanCanvas);
    const left = 58;
    const bottom = 36;
    drawAxes(ctx, width, height, left, bottom);

    if (scanMode && scanMode.value === "2d") {
      const built = buildContrastHeatmap(result.params);
      const allValues = built.values.flat();
      let minV = Math.min(...allValues);
      let maxV = Math.max(...allValues);
      const flat = Math.abs(maxV - minV) < 1e-9;
      if (Math.abs(maxV - minV) < 1e-9) {
        minV -= 0.5;
        maxV += 0.5;
      }
      const plotWidth = width - left - 70;
      const plotHeight = height - bottom - 20;
      const cellWidth = plotWidth / built.xPoints;
      const cellHeight = plotHeight / built.yPoints;
      built.values.forEach((row, yIndex) => {
        row.forEach((value, xIndex) => {
          const norm = (value - minV) / (maxV - minV || 1);
          const hue = flat ? 205 : 220 - 220 * norm;
          const light = flat ? 72 : 58 - 12 * Math.abs(norm - 0.5);
          ctx.fillStyle = `hsl(${hue}, 72%, ${light}%)`;
          ctx.fillRect(
            left + xIndex * cellWidth,
            20 + (built.yPoints - 1 - yIndex) * cellHeight,
            cellWidth + 0.5,
            cellHeight + 0.5
          );
        });
      });

      ctx.strokeStyle = "rgba(15,23,42,0.22)";
      ctx.strokeRect(left, 20, plotWidth, plotHeight);

      const legendX = width - 38;
      for (let i = 0; i < 100; i += 1) {
        const norm = i / 99;
        const hue = 220 - 220 * norm;
        const light = 58 - 12 * Math.abs(norm - 0.5);
        ctx.fillStyle = `hsl(${hue}, 72%, ${light}%)`;
        ctx.fillRect(legendX, 20 + (99 - i) * (plotHeight / 100), 12, plotHeight / 100 + 1);
      }
      ctx.strokeStyle = "rgba(15,23,42,0.22)";
      ctx.strokeRect(legendX, 20, 12, plotHeight);

      ctx.fillStyle = "rgba(12,13,16,0.72)";
      ctx.font = "12px sans-serif";
      ctx.fillText("ODMR contrast heatmap", left, 12);
      ctx.fillText(scanAxisLabel(built.xParam), width - 240, 16);
      ctx.save();
      ctx.translate(16, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(scanAxisLabel(built.yParam), 0, 0);
      ctx.restore();
      ctx.fillText(`${built.xStart.toFixed(2)}`, left, height - 8);
      ctx.fillText(`${built.xEnd.toFixed(2)}`, left + plotWidth - 28, height - 8);
      ctx.fillText(`${built.yStart.toFixed(2)}`, 10, height - bottom + 4);
      ctx.fillText(`${built.yEnd.toFixed(2)}`, 10, 24);
      ctx.fillText(`${maxV.toFixed(2)}%`, width - 20, 20);
      ctx.fillText(`${minV.toFixed(2)}%`, width - 20, height - bottom);
      if (flat) {
        ctx.fillStyle = "rgba(12,13,16,0.78)";
        ctx.fillText("Flat contrast across the selected scan window", left + 12, 38);
      }
      return;
    }

    const built = buildContrastScan(result.params);
    const xs = built.scan.map((point) => point.x);
    const ys = built.scan.map((point) => point.contrast);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);
    if (Math.abs(maxY - minY) < 1e-9) {
      minY -= 0.5;
      maxY += 0.5;
    } else {
      const pad = 0.08 * (maxY - minY);
      minY -= pad;
      maxY += pad;
    }
    const xFrom = (x) => left + ((width - left - 16) * (x - minX)) / (maxX - minX || 1);
    const yFrom = (y) => height - bottom - ((height - bottom - 20) * (y - minY)) / (maxY - minY || 1);

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    built.scan.forEach((point, index) => {
      const x = xFrom(point.x);
      const y = yFrom(point.contrast);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#1d4ed8";
    built.scan.forEach((point, index) => {
      const stride = Math.max(1, Math.floor(built.scan.length / 14));
      if (index !== 0 && index !== built.scan.length - 1 && index !== Math.floor(built.scan.length / 2) && index % stride !== 0) return;
      ctx.beginPath();
      ctx.arc(xFrom(point.x), yFrom(point.contrast), 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (minY < 0 && maxY > 0) {
      const y0 = yFrom(0);
      ctx.strokeStyle = "rgba(15,23,42,0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(left, y0);
      ctx.lineTo(width - 12, y0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(12,13,16,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText("ODMR contrast scan", left, 12);
    ctx.fillText(`${maxY.toFixed(2)}%`, 12, 20);
    ctx.fillText(`${minY.toFixed(2)}%`, 12, height - bottom);
    ctx.fillText(`${minX.toFixed(2)}`, left, height - 8);
    ctx.fillText(`${maxX.toFixed(2)}`, width - 52, height - 8);
    ctx.fillText(scanAxisLabel(built.parameter), width - 220, 28);
    if (Math.abs(maxY - minY) < 1.1) {
      ctx.fillStyle = "rgba(12,13,16,0.64)";
      ctx.fillText("Near-flat scan: selected parameter has little effect in this window", left + 10, 34);
    }
  }

  function drawPulsedOdmr(result) {
    if (!pulsedOdmrCanvas) return;
    const { ctx, width, height } = prepareCanvas(pulsedOdmrCanvas);
    const left = 58;
    const bottom = 36;
    drawAxes(ctx, width, height, left, bottom);

    const sweep = result.pulsed.odmrSweep;
    if (!sweep || sweep.length < 2) return;
    const minF = sweep[0].freq;
    const maxF = sweep[sweep.length - 1].freq;
    const contrasts = sweep.map((p) => p.contrast);
    let minC = Math.min(...contrasts);
    let maxC = Math.max(...contrasts);
    if (Math.abs(maxC - minC) < 1e-9) { minC -= 0.5; maxC += 0.5; }
    else { const pad = 0.08 * (maxC - minC); minC -= pad; maxC += pad; }
    const yC = (c) => height - bottom - ((height - bottom - 20) * (c - minC)) / (maxC - minC || 1);
    const xF = (f) => left + ((width - left - 16) * (f - minF)) / (maxF - minF || 1);

    // Draw steady-state ODMR in grey for comparison.
    ctx.strokeStyle = "rgba(100,116,139,0.38)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const ss = result.odmr.sweep;
    const ssMinF = ss[0].freq;
    const ssMaxF = ss[ss.length - 1].freq;
    const ssContrasts = ss.map((p) => p.contrast);
    const ssMinC = Math.min(...ssContrasts);
    const ssMaxC = Math.max(...ssContrasts);
    ss.forEach((p, i) => {
      const x = left + ((width - left - 16) * (p.freq - ssMinF)) / (ssMaxF - ssMinF || 1);
      // Rescale to pulsed y-axis range for overlay.
      const c = ssMinC === ssMaxC ? (minC + maxC) / 2 : minC + ((p.contrast - ssMinC) / (ssMaxC - ssMinC)) * (maxC - minC);
      if (i === 0) ctx.moveTo(x, yC(c)); else ctx.lineTo(x, yC(c));
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Pulsed ODMR curve.
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    sweep.forEach((p, i) => {
      if (i === 0) ctx.moveTo(xF(p.freq), yC(p.contrast));
      else ctx.lineTo(xF(p.freq), yC(p.contrast));
    });
    ctx.stroke();

    if (minC < 0 && maxC > 0) {
      const y0 = yC(0);
      ctx.strokeStyle = "rgba(15,23,42,0.22)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(left, y0); ctx.lineTo(width - 12, y0); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(12,13,16,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Pulsed ODMR (orange) vs steady-state (grey, rescaled)", left, 12);
    ctx.fillText(`init ${result.params.initDuration || 5} µs → MW ${result.params.mwPulseDuration || 2} µs → read ${result.params.readDuration || 0.5} µs`, left, 26);
    ctx.fillText(`${maxC.toFixed(2)}%`, 12, 20);
    ctx.fillText(`${minC.toFixed(2)}%`, 12, height - bottom);
    ctx.fillText(`${minF.toFixed(1)} MHz`, left, height - 8);
    ctx.fillText(`${maxF.toFixed(1)} MHz`, width - 82, height - 8);
  }

  function drawRabi(result) {
    if (!rabiCanvas) return;
    const { ctx, width, height } = prepareCanvas(rabiCanvas);
    const left = 58;
    const bottom = 36;
    drawAxes(ctx, width, height, left, bottom);

    const curve = result.pulsed.rabi;
    if (!curve || curve.length < 2) return;
    const maxT = curve[curve.length - 1].tMw;
    const pls = curve.map((p) => p.pl);
    const plRef = curve[0].plRef;
    let minPL = Math.min(...pls);
    let maxPL = Math.max(...pls, plRef);
    if (Math.abs(maxPL - minPL) < 1e-12) { minPL -= 0.001; maxPL += 0.001; }
    else { const pad = 0.08 * (maxPL - minPL); minPL -= pad; maxPL += pad; }
    const yP = (v) => height - bottom - ((height - bottom - 20) * (v - minPL)) / (maxPL - minPL || 1);
    const xT = (t) => left + ((width - left - 16) * t) / (maxT || 1);

    // Reference line (no MW, dark then readout).
    ctx.strokeStyle = "rgba(100,116,139,0.5)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(left, yP(plRef)); ctx.lineTo(width - 16, yP(plRef)); ctx.stroke();
    ctx.setLineDash([]);

    // MW-pulse PL curve.
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    curve.forEach((p, i) => {
      if (i === 0) ctx.moveTo(xT(p.tMw), yP(p.pl));
      else ctx.lineTo(xT(p.tMw), yP(p.pl));
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(12,13,16,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText("MW pulse: readout PL vs pulse duration", left, 12);
    ctx.fillText(`at fMW = ${result.peakFrequencyMHz.toFixed(1)} MHz (ODMR peak). Dashed = no-MW reference.`, left, 26);
    ctx.fillText("0 µs", left, height - 8);
    ctx.fillText(`${maxT.toFixed(1)} µs`, width - 44, height - 8);
    ctx.fillText(`${maxPL.toFixed(4)}`, 4, 20);
    ctx.fillText(`${minPL.toFixed(4)}`, 4, height - bottom);
  }

  function drawT1(result) {
    if (!t1Canvas) return;
    const { ctx, width, height } = prepareCanvas(t1Canvas);
    const left = 58;
    const bottom = 36;
    drawAxes(ctx, width, height, left, bottom);

    const curve = result.pulsed.t1;
    if (!curve || curve.length < 2) return;
    const maxT = curve[curve.length - 1].tDark;
    const pls = curve.map((p) => p.pl);
    const plRef0 = curve[0].pl;
    let minPL = Math.min(...pls);
    let maxPL = Math.max(...pls);
    if (Math.abs(maxPL - minPL) < 1e-12) { minPL -= 0.001; maxPL += 0.001; }
    else { const pad = 0.08 * (maxPL - minPL); minPL -= pad; maxPL += pad; }
    const yP = (v) => height - bottom - ((height - bottom - 20) * (v - minPL)) / (maxPL - minPL || 1);
    const xT = (t) => left + ((width - left - 16) * t) / (maxT || 1);

    // T1 decay / recovery curve.
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    curve.forEach((p, i) => {
      if (i === 0) ctx.moveTo(xT(p.tDark), yP(p.pl));
      else ctx.lineTo(xT(p.tDark), yP(p.pl));
    });
    ctx.stroke();

    // Mark τ=0 point.
    ctx.fillStyle = "#0369a1";
    ctx.beginPath();
    ctx.arc(xT(0), yP(plRef0), 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(12,13,16,0.72)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Spin decay: readout PL vs dark time after init laser", left, 12);
    ctx.fillText("0 µs", left, height - 8);
    ctx.fillText(`${maxT.toFixed(1)} µs`, width - 44, height - 8);
    ctx.fillText(`${maxPL.toFixed(4)}`, 4, 20);
    ctx.fillText(`${minPL.toFixed(4)}`, 4, height - bottom);
  }

  function updateSummary(result) {
    const pair = result.pair;
    summary.innerHTML = `
      <p>
        This solver now follows the physical picture you described: two electrons are co-localized on <strong>Defect A</strong> in
        localized singlet states <strong>S0_A</strong> and <strong>S1_A</strong>, ISC populates a localized triplet manifold on A, and
        charge separation creates a real A-B spin pair.
      </p>
      <p>
        The A-B pair is described by a true two-electron Hamiltonian with Zeeman terms for both spins, isotropic exchange
        <strong>J</strong>, and dipolar coupling scaling as <strong>1/r^3</strong>. Its eigenstates <strong>P0...P3</strong> are populated through
        spin-selective pair creation rates <strong>k_crt^S</strong> and <strong>k_crt^T</strong>, and emptied through spin-selective
        recombination rates <strong>k_rec^S -&gt; S1</strong>, <strong>k_rec^S -&gt; S0</strong>, and <strong>k_rec^T</strong>.
      </p>
      <p>
        At the current settings the dipolar coupling is <strong>${pair.dipolarMHz.toFixed(3)}</strong> MHz, and the strongest pair transitions
        lie near <strong>${pair.minus.toFixed(2)}</strong> and <strong>${pair.plus.toFixed(2)}</strong> MHz. The ODMR sign now depends on whether
        MW redistributes population toward the bright singlet-like recombination path or the darker triplet-like path.
      </p>
      <p>
        The simulator is currently running in <strong>${result.params.regimeMode === "ensemble" ? "ensemble" : "single-pair"}</strong> mode.
        ${result.params.regimeMode === "ensemble"
          ? `It averages over <strong>${result.ensembleCount}</strong> static realization(s) of local pair fields, with
        longitudinal/transverse disorder widths <strong>${result.params.hyperfineALong_MHz.toFixed(2)}</strong>/<strong>${result.params.hyperfineATrans_MHz.toFixed(2)}</strong> MHz on A and
        <strong>${result.params.hyperfineBLong_MHz.toFixed(2)}</strong>/<strong>${result.params.hyperfineBTrans_MHz.toFixed(2)}</strong> MHz on B.`
          : `It uses one representative A-B spin pair with fixed local-field components
        A = (<strong>${result.params.hyperfineATrans_MHz.toFixed(2)}</strong> trans., <strong>${result.params.hyperfineALong_MHz.toFixed(2)}</strong> long.) MHz and
        B = (<strong>${result.params.hyperfineBTrans_MHz.toFixed(2)}</strong> trans., <strong>${result.params.hyperfineBLong_MHz.toFixed(2)}</strong> long.) MHz.`}
        The energy-level diagram still shows the representative realization used for the displayed manifold.
      </p>
    `;
  }

  function render() {
    try {
      const result = SpinPairSimulator.runModel(readParams());
      lastResult = result;
      updateMetrics(result);
      updateTable(result);
      drawTrace(result);
      drawBars(result);
      drawOdmr(result);
      drawContrastScan(result);
      drawPulsedOdmr(result);
      drawRabi(result);
      drawT1(result);
      updateLifetimes(result);
      updateEnergyDiagram(result);
      updateSummary(result);
      if (status) {
        status.classList.remove("error");
        status.textContent = result.params.regimeMode === "ensemble"
          ? `Simulator running. Averaging ${result.ensembleCount} static realization(s) with spin-selective creation and recombination.`
          : "Simulator running. Single-pair regime with no ensemble averaging.";
      }
      if (energyInfo) {
        energyInfo.textContent = `Showing ${energyMode && energyMode.value === "on" ? "MW on" : "MW off"} populations and rates from the same Defect A / pair solver.`;
      }
    } catch (error) {
      if (status) {
        status.classList.add("error");
        status.textContent = `Render error: ${error.message}`;
      }
      throw error;
    }
  }

  buildControls();
  const storedDefaults = loadStoredDefaults();
  if (storedDefaults) writeParams(storedDefaults);
  setStatusMessage("Simulator JS build 20260312ag loaded.");
  window.__spinPairApplyPreset = applyNamedPreset;
  root.addEventListener("click", (event) => {
    const infoButton = event.target.closest("[data-role='param-info-button']");
    if (infoButton) {
      event.preventDefault();
      event.stopPropagation();
      const wrapper = infoButton.closest(".sim-control");
      const popover = wrapper?.querySelector(".sim-info-popover");
      const willOpen = Boolean(popover?.hidden);
      closeAllParamInfo();
      if (popover && willOpen) {
        popover.hidden = false;
        const rect = infoButton.getBoundingClientRect();
        const maxWidth = Math.min(320, window.innerWidth - 32);
        const left = Math.max(16, Math.min(rect.right - maxWidth, window.innerWidth - maxWidth - 16));
        const top = Math.min(rect.bottom + 8, window.innerHeight - 180);
        popover.style.left = `${left}px`;
        popover.style.top = `${Math.max(16, top)}px`;
        infoButton.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if (!event.target.closest(".sim-info-popover")) closeAllParamInfo();
  });
  form.addEventListener("input", render);
  [scanMode, scanParam, scanStart, scanEnd, scanPoints, scanParamY, scanStartY, scanEndY, scanPointsY]
    .forEach((control) => control?.addEventListener("input", render));
  regimeMode?.addEventListener("change", render);
  presetSelect?.addEventListener("change", () => {
    applyNamedPreset(presetSelect.value);
  });
  resetButton?.addEventListener("click", () => {
    const stored = loadStoredDefaults();
    writeParams(stored || SpinPairSimulator.defaultParams);
    render();
    setStatusMessage(stored
      ? "Loaded your saved custom defaults."
      : "Loaded the built-in simulator defaults.");
  });
  zeroAllButton?.addEventListener("click", () => {
    form.querySelectorAll("input").forEach((input) => {
      input.value = 0;
    });
    render();
    setStatusMessage("Set all numeric parameters to zero.");
  });
  exportParamsButton?.addEventListener("click", () => {
    exportCurrentParams();
  });
  saveDefaultsButton?.addEventListener("click", () => {
    saveCurrentAsDefaults();
  });
  if (energyMode) {
    energyMode.addEventListener("change", () => {
      if (lastResult) updateEnergyDiagram(lastResult);
    });
  }
  bindEnergyInteractions();
  window.addEventListener("resize", render);
  window.addEventListener("load", () => {
    render();
    window.setTimeout(render, 50);
  });
  } catch (error) {
    const status = document.getElementById("sim-status");
    if (status) {
      status.classList.add("error");
      status.textContent = `Init error: ${error.message}`;
    }
    throw error;
  }
})();
