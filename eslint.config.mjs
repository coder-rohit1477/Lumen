import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: ['test_reports/**'],
  },
]

export default config
