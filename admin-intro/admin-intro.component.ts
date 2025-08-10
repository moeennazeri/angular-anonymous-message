import { Component, ViewChild  } from '@angular/core';
import { FormsModule } from '@angular/forms';  // اضافه کردن FormsModule
import { CommonModule } from '@angular/common';
import { MessageService,SocialLink } from '../services/message.service';
import { ValidatorService } from '../services/validator.service';
import { TooltipDirective } from 'ngx-bootstrap/tooltip';
import { QRCodeModule } from 'angularx-qrcode';
import { NotificationService } from '../services/notification.service';
import { PublicService } from '../services/public.service';
import { ManageCampainComponent } from "../manage-campain/manage-campain.component";

@Component({
  selector: 'app-admin-intro',
  standalone: true,
  imports: [FormsModule,CommonModule,TooltipDirective,QRCodeModule,ManageCampainComponent],
  templateUrl: './admin-intro.component.html',
  styleUrl: './admin-intro.component.scss'
})
export class AdminIntroComponent {
  @ViewChild('tooltipDirective', { static: false }) tooltip: TooltipDirective | undefined;
  tooltipText: string = '⚠️ لطفاً کیبورد خود را به انگلیسی تغییر دهید!';
  showTooltip: boolean = false;
  username: string = '';

  password: string = '';
  confirmPassword: string = ''; // New property for confirming password
  confirmPasswordError: string = ''; // New property for confirm password error
  responseLink: string | null = null;
  isPopupVisible: boolean = false;
  isNewDivVisible: boolean = false;
  isError: boolean = false;
  socialLinks: SocialLink[] = [];
  anonymousMessage: string = '';
  messageData: any = {};
  anonymousLink: string = ''; // لینک دریافتی از سرور
  
  phoneError: string = ''; // Changed from phoneError to general error for username
  passwordError: string = '';
  savedMessage: string = '';  // اضافه کردن متغیر برای ذخیره پیام
  showLinkButton: boolean = true;
  showAll = false;
  currentPath: string = '';
  Popupqr: boolean = false;
  copied: boolean = false;
  usernameError: string = '';


  constructor(
    public loading: PublicService,
    private messageService: MessageService,
    private validatorService: ValidatorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.socialLinks = this.messageService.getSocialLinks();
    this.currentPath = window.location.pathname;
  }

  shareOnSocial(link: SocialLink) {
    console.log('✅ کلیک شد روی:', link.name);

    if (!this.responseLink) {
      console.warn('⚠️ responseLink خالی است!');
      return;
    }

    const fullUrl = link.url + encodeURIComponent(this.responseLink);
    console.log('🔗 لینک اشتراک‌گذاری:', fullUrl);
    window.open(fullUrl, '_blank');
  }

  // --- تغییر در منطق toggleNewDiv() ---
  toggleNewDiv() {
    if (!this.anonymousMessage.trim()) {
      this.isError = true;
      this.isNewDivVisible = false;
      console.log('⛔ پیام خالی است، نمایش فرم متوقف شد.');
    } else {
      this.isError = false;
      this.savedMessage = this.anonymousMessage;

      // ریست کردن فرم (فیلدهای یوزرنیم و پسورد)
      this.resetForm();

      // // --- منطق جدید: بررسی توکن قبل از نمایش پاپ‌آپ ---
      // if (this.hasToken()) {
      //   console.log('✅ توکن وجود دارد. پاپ‌آپ نمایش داده نمی‌شود و مستقیماً لینک ساخته می‌شود.');
      //   this.loading.ShowLoading(); // نمایش لودینگ قبل از فراخوانی sendMessageToServer
      //   this.sendMessageToServer(true); // true یعنی بدون نیاز به اعتبار سنجی فرم
      // } else {
      //   console.log('⚠️ توکن یافت نشد. پاپ‌آپ ورود اطلاعات نمایش داده می‌شود.');
        this.isNewDivVisible = true;
        this.togglePopup(); // نمایش پاپ‌آپ
      // }
    }
  }

  // ۲. نمایش پاپ‌آپ ورود اطلاعات
  togglePopup() {
    this.isPopupVisible = true;
  }

  // --- متد جدید برای بررسی وجود توکن ---
  hasToken(): boolean {
    const token = localStorage.getItem('Token');
    return !!token; // اگر توکن وجود داشته باشد (null یا undefined نباشد)، true برمی‌گرداند.
  }

  // --- تغییر در sendMessageToServer() برای هندل کردن دو سناریو ---
  // async sendMessageToServer(skipValidation: boolean = false) {
  //   // Clear any previous errors only if not skipping validation
  //   if (!skipValidation) {
  //     this.usernameError = '';
  //     this.passwordError = '';
  //     this.confirmPasswordError = '';
  //   }

  //   // Trim whitespace from inputs only if not skipping validation
  //   if (!skipValidation) {
  //     this.username = this.username.trim();
  //     this.password = this.password.trim();
  //     this.confirmPassword = this.confirmPassword.trim();
  //   }

  //   let isValid = true; // Variable to check input validity

  //   // Perform validation only if not skipping validation
  //   if (!skipValidation) {
  //     // 1. Validate username
  //     if (!this.username) {
  //       this.usernameError = 'نام کاربری نمی‌تواند خالی باشد.';
  //       isValid = false;
  //     } else if (this.username.length < 3) {
  //       this.usernameError = 'نام کاربری باید حداقل ۳ کاراکتر باشد.';
  //       isValid = false;
  //     } else if (!/^[a-zA-Z0-9]+$/.test(this.username)) {
  //       this.usernameError = 'نام کاربری فقط می‌تواند شامل حروف و اعداد انگلیسی باشد.';
  //       isValid = false;
  //     }

  //     // 2. Validate password
  //     if (!this.validatorService.validatePassword(this.password)) {
  //       this.passwordError = 'رمز عبور باید حداقل ۴ کاراکتر باشه';
  //       isValid = false;
  //     }

  //     // 3. Validate password and confirm password match
  //     if (this.password !== this.confirmPassword) {
  //       this.confirmPasswordError = 'رمز عبور و تکرار آن یکسان نیستند.';
  //       isValid = false;
  //     }
  //   }

  //   // If inputs are valid (or validation is skipped), send data to the server
  //   if (isValid || skipValidation) {
  //     this.isPopupVisible = false;
  //     this.isNewDivVisible = true;
  //     this.showLinkButton = false;

      

  //     // Data to send to the server
  //     const requestData: any = {
       
  //       title: this.savedMessage,
  //       phoneExist: false, // assuming this is not relevant for username/password based system
  //       maxLength: 200,
  //       url: this.currentPath,
  //       description: '',
  //       imageUrl: '',
  //       logo: '',
  //       pageTitle: '',
  //       pageDescription: '',
  //       socialId: 'پونز', // این را خالی می‌گذاریم اگر فقط UserName استفاده می‌شود
  //       socialName: 'پونز',
  //       phoneRequire: false, // assuming this is not relevant for username/password based system
  //     };

  //     // Add username and password only if not skipping validation (i.e., user is signing up/logging in)
  //     if (!skipValidation) {
  //       requestData.userName = this.username; // اضافه کردن UserName فقط در صورت نیاز
  //       requestData.password = this.password; // اضافه کردن password فقط در صورت نیاز
  //     }

  //     console.log('ارسال اطلاعات به سرور:', requestData);

  //     this.messageService.sendMessage(requestData).subscribe({
  //       next: (response) => {
  //         console.log('پاسخ از سرور:', response);
  //         this.anonymousLink = response.url;
  //         this.responseLink = response.url;
         
  //         this.isPopupVisible = false;
  //         this.isNewDivVisible = true;
         

  //         // اگر سرور در پاسخ توکن جدیدی برمی‌گرداند، آن را ذخیره کنید.
  //         // فرض بر این است که سرور توکن را در response.token برمی‌گرداند.
  //         if (response.token) {
  //           localStorage.setItem('Token', response.token);
  //           console.log('✅ توکن جدید در localStorage ذخیره شد.');
  //         }
  //       },
  //       error: (error) => {
  //         console.error('خطا در ارسال اطلاعات:', error);
  //         this.loading.HideLoading();

  //         let errorMessage = 'خطا در ارسال اطلاعات به سرور. لطفاً دوباره تلاش کنید.';
  //         if (error && error.error && typeof error.error === 'string') {
  //           errorMessage = error.error;
  //         } else if (error && error.message) {
  //           errorMessage = error.message;
  //         } else if (error && error.status) {
  //           errorMessage = `خطا: ${error.status} - ${error.statusText || 'خطای ناشناخته'}`;
  //         }

  //         this.messageBoxConfig = {
  //           type: 'error',
  //           message: errorMessage,
  //           title: 'خطا',
  //         };
  //         // اینجا باید منطقی برای نمایش messageBoxConfig وجود داشته باشد (مثلا showMessageBox = true)
  //       },
  //       complete: () => {
  //         this.loading.HideLoading();
  //       }
  //     });

  //     this.notificationService.initializePushNotifications();
  //     // Clear fields after sending
  //     if (!skipValidation) { // فقط در صورتی که فیلدها از پاپ‌آپ پر شده‌اند پاک شوند
  //       this.username = '';
  //       this.password = '';
  //       this.confirmPassword = '';
  //     }
  //   } else {
  //     this.loading.HideLoading(); // اگر اعتبار سنجی ناموفق بود، لودینگ را مخفی کن
  //   }
  // }
async sendMessageToServer(skipValidation: boolean = false) {
  this.loading.ShowLoading();

  if (!skipValidation) {
    this.passwordError = '';
    this.password = this.password.trim();
  }

  let isValid = true;

  // اعتبارسنجی رمز عبور
  if (!skipValidation) {
    if (!this.validatorService.validatePassword(this.password)) {
      this.passwordError = 'رمز عبور باید حداقل ۴ کاراکتر باشد و شامل حروف فارسی نباشد.';
      isValid = false;
    } else if (/[^\x00-\x7F]/.test(this.password)) {
      this.passwordError = 'رمز عبور نمی‌تواند شامل حروف فارسی یا کاراکترهای غیرانگلیسی باشد.';
      isValid = false;
    }
  }

  // اعتبارسنجی پیام ناشناس
  if (!this.anonymousMessage.trim()) {
    this.isError = true;
    this.isNewDivVisible = false;
    isValid = false;
  } else {
    this.savedMessage = this.anonymousMessage;
  }

  if (isValid || skipValidation) {
    this.isPopupVisible = false;
    this.isNewDivVisible = true;
    this.showLinkButton = false;

    const requestData: any = {
      title: this.savedMessage,
      phoneExist: false,
      maxLength: 200,
      url: "https://punz.ir",
      description: '',
      imageUrl: '',
      logo: '',
      pageTitle: '',
      pageDescription: '',
      socialId: 'punz.ir',
      socialName: 'ابزار های تعاملی پونِز',
      phoneRequire: false,
      password: this.password
    };

    this.messageService.sendMessage(requestData).subscribe({
      next: (response) => {
        this.anonymousLink = response.url;
        this.responseLink = response.url;
        this.isPopupVisible = false;
        this.isNewDivVisible = true;

        this.loading.showMsg({
          title: 'تبریک!',
          message: 'پیام با موفقیت ارسال شد.',
          type: 'success',
          duration: 2500
        });

        scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        let errorMessage = 'خطا در ارسال اطلاعات به سرور. لطفاً دوباره تلاش کنید.';
        if (error?.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (error?.status) {
          errorMessage = `خطا: ${error.status} - ${error.statusText || 'خطای ناشناخته'}`;
        }

        this.loading.showMsg({
          title: 'خطا',
          message: errorMessage,
          type: 'error',
          duration: 3000
        });
        this.loading.HideLoading();
        scrollTo({ top: 0, behavior: 'smooth' });
        
      },
      complete: () => {
        this.loading.HideLoading();
      }
    });

    this.notificationService.initializePushNotifications();

    if (!skipValidation) {
      this.password = '';
    }
  } else {
    this.loading.HideLoading();
  }
}



  copyToClipboard() {
    if (this.anonymousLink) {
      navigator.clipboard.writeText(this.anonymousLink)
        .then(() => {
          this.copied = true;
          setTimeout(() => {
            this.copied = false;
          }, 1500);
          console.log('✅ لینک با موفقیت کپی شد!');
        })
        .catch(err => {
          console.error('❌ خطا در کپی کردن لینک: ', err);
        });
    } else {
      console.warn('⚠️ لینکی برای کپی کردن وجود ندارد.');
    }
  }

  encodeUrl(url: string): string {
    return encodeURIComponent(url);
  }

  resetForm() {
    this.password = '';
    this.confirmPassword = '';
    this.anonymousMessage = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.anonymousLink = '';
  
    this.isPopupVisible = false;
    this.showLinkButton = true;
    this.usernameError = ''; // Add this to clear username error on reset

    console.log('🔄 فرم ریست شد.');
  }



  checkAndPreventPersianInput(event: KeyboardEvent) {
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    const key = event.key;

    if (persianRegex.test(key)) {
      event.preventDefault();
      this.showTooltip = true;
      this.tooltip?.show();
    } else {
      this.showTooltip = false;
      this.tooltip?.hide();
    }
  }

  hideTooltip() {
    this.showTooltip = false;
    this.tooltip?.hide();
  }

  closePopup() {
    this.isPopupVisible = false;
    this.usernameError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    // this.username = ''; // Decide if you want to clear username on close
    // this.password = '';
    // this.confirmPassword = '';
  }
}