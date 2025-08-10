import { Component, OnInit,ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { mobileApiService,ServerData,Card, Item, loadmember } from '../services/mobile-api.service';
import { HttpResponse } from '@angular/common/http';
import { ManageCampainComponent } from "../manage-campain/manage-campain.component";
import { Router } from '@angular/router';
import { TooltipDirective } from 'ngx-bootstrap/tooltip';
import { ValidatorService } from '../services/validator.service';
import { NotificationService } from '../services/notification.service';
import { PublicService } from '../services/public.service';

@Component({
  selector: 'app-custom-page',
  templateUrl: './custom-page.component.html',
  styleUrls: ['./custom-page.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule,ManageCampainComponent,TooltipDirective ],
})
export class CustomPageComponent implements OnInit {
  @ViewChild('tooltipDirective', { static: false }) tooltip: TooltipDirective | undefined;
  tooltipText: string = '⚠️ لطفاً کیبورد خود را به انگلیسی تغییر دهید!';
  showTooltip: boolean = false;
  username: string = ''; // برای ngModel اینپوت شماره موبایل
  phoneError: string = ''; // در صورت نیاز به نمایش خطا
  mobileNumber: string = '';
  message: string = ''; 
  showMessageButton:boolean=true;
  messageError: string = '';
  numberError: string = '';
  isLoading: boolean = false;
  serverData: ServerData = {
    title: '',
    description: '',
    imageUrl: '',
    url: '',
    logo: '',
    pageTitle: '',
    pageDescription: '',
    socialId: '',
    socialName: '',
    phoneExist: false,   // ✅ اضافه شد
    phoneRequire: false, // ✅ اضافه شد
    maxLength: 10,
    minLength: 0,
    token: ''
  };
  // --- New properties for password popup ---
  isPasswordPopupVisible: boolean = false;
  viewPassword: string = '';
  viewPasswordError: string = '';

  currentPath: string = '';
  constructor(
    private router: Router,
    private mobileApiService: mobileApiService,
    private validatorService: ValidatorService,
    private notificationService: NotificationService,
    public loading:PublicService
  ) {}

  messages: Card[] = []; 
  platformItems: Item[] = [];
  campaignItems: Item[] = [];

ngOnInit() {
  this.currentPath = window.location.pathname;
  console.log("Before getMessage call");

  const currentPath = window.location.pathname;
  const requestData = { url: currentPath };

  this.loading.ShowLoading();

  this.mobileApiService.getMessage(requestData).subscribe({
    next: (response: ServerData) => {
      this.serverData = response;

      if (this.serverData.phoneExist) {
        this.showMobileInput = true;
        this.isMobileValidationRequired = this.serverData.phoneRequire;
      } else {
        this.showMobileInput = false;
      }

      if (this.serverData.token) {
        localStorage.setItem('Token', this.serverData.token);
        console.log('توکن ذخیره شد:', this.serverData.token);
      }

      this.loadInitialMessages();
    },
    error: (error) => {
      console.error("خطا در دریافت اطلاعات:", error);

      this.loading.showMsg({
        title: 'خطا',
        message: 'خطا در دریافت اطلاعات از سرور. لطفاً دوباره تلاش کنید.',
        type: 'error',
        duration: 3000
      });

      scrollTo({ top: 0, behavior: 'smooth' });
      this.loading.HideLoading();
    },
    complete: () => {
      this.loading.HideLoading();
      console.log("getMessage call completed. Loading hidden.");
    }
  });
}

 
  showMobileInput: boolean = false;
  isMobileValidationRequired: boolean = false;

  updateCharacterCount(value: string) {
    const maxLength = this.serverData.maxLength || 200;
    const minLength = this.serverData.minLength || 0;
  
    if (value.length > maxLength) {
      this.message = value.slice(0, maxLength);
    } else {
      this.message = value;
    }
  
    if (this.message.trim().length < minLength) {
      this.messageError = `پیام باید حداقل ${minLength} کاراکتر داشته باشد.`;
    } else {
      this.messageError = '';
    }
  }
  

async sendMessage() {
  // اعتبار سنجی اولیه پیام
  if (!this.message.trim()) {
    this.messageError = 'لطفاً پیام خود را وارد کنید.';
    return;
  } else {
    const minLength = this.serverData.minLength || 0;
    if (this.message.trim().length < minLength) {
      this.messageError = `پیام باید حداقل ${minLength} کاراکتر داشته باشد.`;
      return;
    }
    this.messageError = '';
  }

  // اعتبار سنجی شماره موبایل (اگر لازم بود)
  if (this.showMobileInput) {
    if (this.isMobileValidationRequired) {
      const isValid = this.validatorService.validatePhoneNumber(this.mobileNumber);
      if (!isValid) {
        this.numberError = 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.';
        return;
      }
    }
    this.numberError = '';
  }

  const currentPath = window.location.pathname;
  const msg = {
    msg: this.message,
    phNumber: this.mobileNumber?.trim() || '',
    url: currentPath
  };

  this.loading.ShowLoading();

  this.mobileApiService.sendMessage(msg).subscribe({
    next: (response: HttpResponse<any>) => {
      if (response.status === 200) {
        const token = response.body?.token;
        if (token) {
          localStorage.setItem('Token', token);
        }

        this.loading.showMsg({
          title: 'تبریک',
          message: 'پیام با موفقیت ارسال شد.',
          type: 'success',
          duration: 2500
        });
        this.loadInitialMessages();

        scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.loading.showMsg({
          title: 'خطا',
          message: 'ارسال پیام موفقیت‌آمیز نبود.',
          type: 'error',
          duration: 2500
        });

        scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    error: (error) => {
      console.error('Error sending message:', error);

      this.loading.showMsg({
        title: 'خطا',
        message: 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.',
        type: 'error',
        duration: 3000
      });

      scrollTo({ top: 0, behavior: 'smooth' });
      this.loading.HideLoading();
    },
    complete: () => {
      this.loading.HideLoading();
    }
  });

  this.notificationService.initializePushNotifications();

  // پاک کردن فیلدهای فرم
  this.mobileNumber = '';
  this.message = '';
}


// async sendMessage() {
//   // اعتبارسنجی پیام
//   if (!this.message.trim()) {
//     this.messageError = 'لطفاً پیام خود را وارد کنید.';
//     return;
//   } else {
//     const minLength = this.serverData.minLength || 0;
//     if (this.message.trim().length < minLength) {
//       this.messageError = `پیام باید حداقل ${minLength} کاراکتر داشته باشد.`;
//       return;
//     }
//     this.messageError = '';
//   }

//   // اعتبارسنجی شماره موبایل (فقط در صورت نیاز)
//   if (this.showMobileInput) {
//     if (this.isMobileValidationRequired) {
//       const isValid = this.validatorService.validatePhoneNumber(this.mobileNumber);
//       if (!isValid) {
//         this.numberError = 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.';
//         return;
//       }
//     }
//     this.numberError = '';
//   }

//   const currentPath = window.location.pathname;
//   const msg = {
//     msg: this.message,
//     phNumber: this.mobileNumber?.trim() || '',
//     url: currentPath
//   };

//   try {
//     // فراخوانی سرویس نوتیفیکیشن به صورت await
//     // فرض بر این است که initializePushNotifications یک Promise برمی‌گرداند یا قابلیت await شدن دارد.
//     await this.notificationService.initializePushNotifications();

//     // استفاده از lastValueFrom برای منتظر ماندن پاسخ سرویس ارسال پیام
//     // این روش تضمین می‌کند که یا یک HttpResponse<any> برگردانده شود یا خطا داده شود.
//     const response: HttpResponse<any> = await lastValueFrom(this.mobileApiService.sendMessage(msg));

//     if (response.status === 200) {
//       const token = response.body?.token;
//       if (token) {
//         localStorage.setItem('Token', token);
//         console.log('✅ توکن ست شد:', token);
//       }

//       this.messageBoxConfig = {
//         type: 'success',
//         message: 'پیام با موفقیت ارسال شد',
//         title: ''
//       };
//     } else {
//       // این بخش برای زمانی است که پاسخ از سرور دریافت شده اما وضعیت HTTP کد 200 نیست.
//       this.messageBoxConfig = {
//         type: 'error',
//         message: 'ارسال پیام موفقیت‌آمیز نبود. کد وضعیت: ' + response.status,
//         title: ''
//       };
//     }
//   } catch (error) {
//     // این بلاک خطاها را مدیریت می‌کند، شامل:
//     // 1. خطاهای شبکه (Network errors)
//     // 2. خطاهای HTTP (مانند 404, 500) که HttpClient به عنوان خطا پرتاب می‌کند.
//     // 3. خطاهایی که از initializePushNotifications برمی‌گردند.
//     // 4. اگر lastValueFrom هیچ مقداری از Observable دریافت نکند (که برای HttpClient نادر است).
//     console.error('Error sending message or initializing push notifications:', error);
//     this.messageBoxConfig = {
//       type: 'error',
//       message: 'خطا در ارسال پیام یا راه‌اندازی نوتیفیکیشن.',
//       title: 'error'
//     };
//   } finally {
//     // پاک کردن فیلدهای فرم (این بخش همیشه اجرا می‌شود، چه موفقیت‌آمیز باشد چه خطا رخ دهد)
//     this.mobileNumber = '';
//     this.message = '';
//   }
// }
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
  // ✅ متد برای لود کردن پیام‌های اولیه و آیتم‌های دراپ‌دان
loadInitialMessages() {
  const requestDatamember: loadmember = {
    url: this.currentPath,
  };

  this.mobileApiService.fetchMessagesmembert(requestDatamember).subscribe(
    (data: any) => {
      if (data) {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          this.messages = data.messages;
        } else {
          this.messages = [];

          this.loading.showMsg({
            title: 'اطلاعیه',
            message: 'هیچ پیامی برای نمایش وجود ندارد.',
            type: 'info',
            duration: 2500
          });

          scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (Array.isArray(data.umDropDownContents)) {
          this.campaignItems = [...data.umDropDownContents];
        }
        if (Array.isArray(data.smDropDownContents)) {
          this.platformItems = [...data.smDropDownContents];
        }
      } else {
        this.messages = [];

        this.loading.showMsg({
          title: 'خطا',
          message: 'دریافت اطلاعات با مشکل مواجه شد.',
          type: 'error',
          duration: 2500
        });

        scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    (error) => {
      console.error('❌ خطای واقعی در دریافت پیام‌ها:', error);
      this.messages = [];

      this.loading.showMsg({
        title: 'خطا',
        message: 'خطا در دریافت پیام‌ها از سرور. لطفاً دوباره تلاش کنید.',
        type: 'error',
        duration: 3000
      });

      scrollTo({ top: 0, behavior: 'smooth' });
    }
  );
}



 // --- New methods for password popup ---
  openPasswordPopup() {
    this.viewPassword = ''; // Clear previous password
    this.viewPasswordError = ''; // Clear previous error
    this.isPasswordPopupVisible = true;
  }

  closePasswordPopup() {
    this.isPasswordPopupVisible = false;
    this.viewPassword = '';
    this.viewPasswordError = '';
  }

   // Modified authenticateAndLoadMessages to use fetchMessagesmembert
authenticateAndLoadMessages() {
  this.viewPasswordError = '';

  if (!this.viewPassword.trim()) {
    this.viewPasswordError = 'لطفاً رمز عبور را وارد کنید.';
    return;
  }

  const requestData: loadmember = {
    url: this.currentPath,
    password: this.viewPassword.trim()
  };

  this.loading.ShowLoading();

  this.mobileApiService.fetchMessagesmembert(requestData).subscribe({
    next: (data: any) => {
      if (data && data.messages) {
        this.closePasswordPopup();
        this.messages = data.messages;
        this.showMessageButton = false;

        if (Array.isArray(data.umDropDownContents)) {
          this.campaignItems = [...data.umDropDownContents];
        }
        if (Array.isArray(data.smDropDownContents)) {
          this.platformItems = [...data.smDropDownContents];
        }

        if (data.token) {
          localStorage.setItem('Token', data.token);
          console.log('توکن جدید پس از احراز هویت ذخیره شد:', data.token);
        }

        this.viewPasswordError = '';
      } else {
        this.viewPasswordError = 'رمز عبور اشتباه است.';
        this.messages = [];

        this.loading.showMsg({
          title: 'خطا',
          message: 'رمز عبور اشتباه است.',
          type: 'error',
          duration: 2500
        });

        scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    error: (error) => {
      console.error('❌ خطا در احراز هویت:', error);
      this.messages = [];

      if (error.status === 401 || error.status === 403) {
        this.viewPasswordError = 'رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.';

        this.loading.showMsg({
          title: 'خطای احراز هویت',
          message: 'رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.',
          type: 'error',
          duration: 3000
        });
      } else {
        this.viewPasswordError = 'خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.';

        this.loading.showMsg({
          title: 'خطا',
          message: 'خطا در دریافت پیام‌ها از سرور.',
          type: 'error',
          duration: 3000
        });
      }
       this.loading.HideLoading();
      scrollTo({ top: 0, behavior: 'smooth' });
    },
    complete: () => {
      this.loading.HideLoading();
      console.log('✅ عملیات احراز هویت و دریافت پیام‌ها کامل شد.');
    }
  });
}


}
