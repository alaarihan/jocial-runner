export function minutesUntilMidnight() {
  var midnight = new Date()
  midnight.setHours(midnight.getHours() + new Date().getTimezoneOffset() / 60)
  midnight.setHours(24)
  midnight.setMinutes(0)
  midnight.setSeconds(0)
  midnight.setMilliseconds(0)

  const currentTime = new Date()
  currentTime.setHours(
    currentTime.getHours() + new Date().getTimezoneOffset() / 60,
  )
  return Math.round((midnight.getTime() - currentTime.getTime()) / 1000 / 60)
}
