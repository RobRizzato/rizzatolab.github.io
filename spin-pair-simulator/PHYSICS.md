# Spin Pair ODMR Simulator: Physics Notes

## Scope

This simulator is a physically motivated **effective population model** for an optically active defect `A` coupled to a nearby defect `B`.

It is designed to capture:

- optical pumping and photoluminescence on defect `A`
- intersystem crossing into a localized triplet manifold on `A`
- charge separation into a real two-electron `A-B` spin pair
- spin-dependent recombination channels
- ODMR contrast emerging from microwave-driven redistribution between bright and dark pathways

It is **not yet** a fully quantitative microscopic model for a specific material/device.

## Physical Picture

The model assumes the following cycle:

1. `S0_A -> S1_A` by laser excitation
2. `S1_A -> S0_A` by radiative or non-radiative decay
3. `S1_A -> T_A` by intersystem crossing (ISC)
4. localized states on `A` create a charge-separated spin pair `(A,B)`
5. the `A-B` pair evolves under a two-electron spin Hamiltonian
6. the pair recombines either into bright singlet-like channels or darker triplet-like channels
7. the cycle closes and the PL changes when MW redistributes population between those routes

This is close in spirit to the defect-pair / radical-pair-like mechanism discussed in:

- Nature Physics article: https://www.nature.com/articles/s41567-025-03091-5

## What Is Physically Sound

The current simulator is scientifically reasonable as an **effective exploratory model** because it includes:

- a real `4x4` two-electron pair Hamiltonian
- Zeeman terms for two different spins
- isotropic exchange `J`
- dipolar coupling with `1/r^3` scaling and angular dependence
- pair eigenstates computed from the Hamiltonian
- MW-induced pair transitions derived from matrix elements of a transverse operator
- spin-selective creation and recombination channels
- a slow triplet-to-singlet return channel on defect `A`

So the simulator is not just drawing arbitrary rates on top of a cartoon. The pair block does contain real spin physics.

## What Is Still Approximate

The current model should be understood as **semi-microscopic**, not fully microscopic.

Main approximations:

1. Population-only dynamics

- The solver uses rate equations for populations.
- It does not evolve a density matrix.
- Therefore it cannot describe coherent oscillations, phase-dependent effects, or proper saturation dynamics beyond an effective rate picture.

2. Effective localized triplet manifold

- The localized triplet on defect `A` is treated as an effective manifold with phenomenological ISC branching and mixing.
- Its internal Hamiltonian is not yet solved as rigorously as the `A-B` pair.

3. Simplified hyperfine fields

- The simulator now includes effective local hyperfine/disorder fields on both spins.
- They are parameterized through longitudinal and transverse components.
- This is still a quasi-static effective-field model, not a full microscopic hyperfine tensor treatment.

4. No `g`-tensor anisotropy

- The model uses scalar `g1`, `g2`.
- Real defects can require anisotropic `g` tensors.

5. No ensemble distributions

- Real data often come from distributions of:
  - pair distance `r`
  - angle `theta`
  - creation/recombination rates
  - local fields
- The paper explicitly emphasizes distributed rates for ensembles.

6. No explicit pair dissociation / alternative charge channels

- The present model closes the cycle through recombination only.
- Real systems may need pair dissociation, ionization, blinking, or charge-state conversion.

7. No temperature dependence

- All rates are static.
- Hopping and recombination may be thermally activated.

## Bottom-Line Assessment

The model is:

- **good enough for qualitative reasoning**
- **good enough to study how ODMR sign depends on geometry and kinetic asymmetry**
- **not yet good enough for parameter extraction from experiment without caution**

In other words: it makes physical sense, but it is not yet a quantitatively controlled fit model.

## Parameters

### A-B Pair Hamiltonian

`pairDistanceNm`

- Distance between the electron on defect `A` and the electron on defect `B`.
- Controls the dipolar interaction strength.
- Smaller `r` gives larger dipolar coupling roughly as `1/r^3`.

`pairThetaDeg`

- Angle between the `A-B` axis and the static magnetic field `B0`.
- Changes the angular part of the dipolar Hamiltonian.

`pairExchangeMHz`

- Isotropic exchange coupling `J` in MHz.
- Positive or negative `J` shifts the pair eigenenergies and transition frequencies.

`pairG1`, `pairG2`

- Effective electron `g` factors for the two defects.
- Their mismatch is important because `g1 != g2` helps produce nontrivial singlet-triplet mixing under field.

`hyperfineALong_MHz`, `hyperfineBLong_MHz`

- Effective longitudinal local-field components on spins A and B.
- In single-pair mode they are fixed local-field values.
- In ensemble mode they are treated as rms widths for static disorder sampling.

`hyperfineATrans_MHz`, `hyperfineBTrans_MHz`

- Effective transverse local-field components on spins A and B.
- These are especially important because they can mix singlet and triplet character even when `g1 = g2`.

`ensembleSamples`

- Number of static disorder realizations used in ensemble mode.
- `1` corresponds to a single representative realization.

### Localized Defect A

`kExc`

- Optical excitation rate `S0_A -> S1_A`.

`kRad`

- Radiative decay rate `S1_A -> S0_A`.
- This is the main direct PL channel.

`kNonRad`

- Non-radiative decay rate `S1_A -> S0_A`.
- Competes with radiative PL.

`kISC`

- Intersystem crossing rate `S1_A -> T_A`.
- Larger values feed more population into the metastable triplet sector.

`brightPairYield`

- Optional PL contribution associated with singlet-like pair recombination that feeds the bright optical channel.
- Increasing it makes pair-assisted bright pathways more visible in the signal.

### Localized Triplet A

`branchTp`, `branchT0`, `branchTm`

- Branching fractions for ISC into localized triplet sublevels `T+`, `T0`, `T-`.

`kTripletToSinglet`

- Slow return rate from localized triplet states to `S0_A`.
- This is what makes the local triplet metastable when it is small.

`kTripletSpinRelax`

- Spin relaxation / mixing within the localized triplet manifold.
- Larger values wash out triplet sublevel selectivity.

### Spin-Selective Pair Kinetics

`kCrtSinglet`

- Pair creation rate from the localized singlet sector.
- Larger values favor injection into pair eigenstates through their singlet weight.

`kCrtTriplet`

- Pair creation rate from the localized triplet sector.
- Larger values favor injection through triplet-weighted channels.

`kRecSingletToS1`

- Singlet-like pair recombination into the bright optical manifold `S1_A`.
- This is usually the key bright recombination channel.

`kRecSingletToS0`

- Direct singlet-like pair recombination into `S0_A`.
- This is a singlet channel that does **not** feed the bright excited manifold.

`kRecTriplet`

- Triplet-like pair recombination into the localized triplet manifold on `A`.
- Acts as a darker / shelving return path.

### Defect A Hamiltonian

`defectCenterMHz`

- Effective transition center frequency for the localized triplet manifold.

`defectStrainMHz`

- Effective zero-field transverse splitting / strain term.

`defectGyroMHzPermT`

- Effective gyromagnetic factor for the localized triplet.

### Microwave and Field

`biasFieldmT`

- Static bias magnetic field `B0`.
- Shifts pair and localized-triplet transition frequencies.

`mwB1mT`

- Transverse MW drive amplitude.
- Larger values increase MW-induced mixing/transition rates.

`dephasingMHz`

- Effective linewidth / dephasing parameter.
- Larger values broaden resonances and reduce spectral sharpness.

`kMwTripletMax`

- Maximum MW-induced localized-triplet mixing rate.

`kMwPairMax`

- Maximum MW-induced pair transition rate.

`mwPowerScale`

- Global multiplier for MW drive strength.

### Simulation

`odmrCenter`

- Microwave frequency used for the on/off comparison and as the center of the ODMR sweep.
- It should be placed near a real pair or defect transition to see an effect.

`odmrSpan`

- Total frequency span of the ODMR sweep.

`odmrPoints`

- Number of points in the sweep.

`traceDuration`

- Duration of the transient simulation in arbitrary time units.

`tracePoints`

- Number of time samples in the transient trace.

## How ODMR Sign Appears In This Model

The simulator defines:

`contrast = (PL_off - PL_on) / PL_off * 100`

Therefore:

- **positive contrast** means `MW on` reduces PL
- **negative contrast** means `MW on` increases PL

The sign is not determined by distance alone.

It comes from the combination of:

- pair geometry: `r`, `theta`
- pair spin Hamiltonian: `J`, `g1`, `g2`, `B0`
- kinetic asymmetry:
  - `kCrtSinglet / kCrtTriplet`
  - `kRecSingletToS1 / kRecSingletToS0 / kRecTriplet`

Typical tendencies:

- Positive contrast is favored when MW moves population away from a bright singlet-dominated path.
- Negative contrast is favored when MW helps recover population from darker triplet-like shelving into bright singlet-like recombination.

## What Should Be Added To Make The Model More Realistic

These are the most important next parameters/extensions.

### High priority

1. Hyperfine fields on both defects

- Improve the current effective local-field model toward full vector/tensor hyperfine fields `B_hyp,A`, `B_hyp,B`.
- This remains one of the most important ingredients controlling singlet-triplet mixing.

2. Ensemble averaging

- Average over distributions of:
  - `r`
  - `theta`
  - `kCrt`
  - `kRec`
  - local fields
- This is essential if the target is ensemble ODMR rather than a single pair.

3. Separate bright and dark recombination observables more carefully

- Right now PL is an effective scalar combination.
- A more realistic model may require separate branching efficiencies for photon emission after recombination.

4. Better localized triplet model

- If defect `A` truly has a local triplet manifold, its own Hamiltonian should be treated more microscopically too.

### Medium priority

5. `g`-tensor anisotropy

- Replace scalar `g1`, `g2` with anisotropic tensors where justified.

6. Pair dissociation / alternate charge channels

- Add escape channels and charge-state conversion if experiments suggest blinking or non-closed dynamics.

7. Temperature dependence

- Let hopping/recombination depend on activation barriers or thermal occupation.

### Advanced / full-microscopic

8. Density-matrix dynamics

- Needed for coherent transients, saturation, and line shapes beyond effective rates.

9. Full MW polarization/orientation treatment

- Important if comparing to angle-resolved ODMR experiments.

10. Phonon-assisted or vibronic structure

- Only needed if the experiment is sensitive to detailed optical relaxation pathways.

## Recommended Interpretation Strategy

Use the simulator in this order:

1. Treat it as a **mechanism explorer**

- Ask which kinetic asymmetries and geometries can produce the sign and qualitative trends.

2. Do not over-interpret absolute fitted numbers yet

- Especially for `kCrt`, `kRec`, and `brightPairYield`.

3. Add realism only where the data require it

- If the sign is wrong, first fix spin-selective kinetics.
- If the line shape is wrong, add hyperfine/distributions.
- If transients are wrong, add extra metastable/charge channels or density-matrix physics.

## Current Recommendation

For the next accuracy upgrade, the single best addition would be:

- **hyperfine-induced or local-field-induced singlet-triplet mixing plus ensemble averaging**

That is likely the most impactful improvement if the goal is to connect ODMR sign and line shape to defect configuration in a more realistic way.
