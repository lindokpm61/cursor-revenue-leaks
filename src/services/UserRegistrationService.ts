// Temporarily disabled - references non-existent tables
export class UserRegistrationService {
  static async registerUser() {
    throw new Error('Service temporarily disabled');
  }
  
  static async handleRegistration() {
    throw new Error('Service temporarily disabled');
  }
  
  static async register(data: any) {
    return { success: false, error: 'Service temporarily disabled' };
  }
}