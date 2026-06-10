import type { Scenario } from '../../types/content'
import { checkInReservation } from './check-in-reservation'
import { checkInWalkIn } from './check-in-walk-in'
import { checkOutPayment } from './check-out-payment'
import { complaintRoom } from './complaint-room'
import { guestQuestions } from './guest-questions'
import { phoneReservation } from './phone-reservation'

export const allScenarios: Scenario[] = [
  checkInReservation,
  guestQuestions,
  checkInWalkIn,
  checkOutPayment,
  phoneReservation,
  complaintRoom,
]
