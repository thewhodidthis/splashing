// The uniform PDF.
const uniform = (min = 0, max = 1) => x => ((x >= min && x <= max) ? 1 / (max - min) : 0)

// REJECTION SAMPLING
// To obtain a sample from distribution "X" with density "desired" using samples
// from distribution "Y" with density "proposal".
// https://en.wikipedia.org/wiki/Rejection_sampling#Algorithm
export default function sampler(desired, proposal = uniform()) {
  return function runner(M = 3, y = Math.random()) {
    // Obtain a sample `y` from distribution Y and a sample `u` from uniform.
    const u = Math.random()

    // The algorithm will take an average of M iterations to obtain a sample.
    const acceptanceRatio = desired(y) / (M * proposal(y))

    // Check whether or not `u < f(y) / Mg(y)`.
    if (acceptanceRatio > u) {
      // If this holds, accept `y` as a sample drawn from `f`.
      return y
    }

    // If not, reject the value and return to the sampling step.
    return runner(M)
  }
}
