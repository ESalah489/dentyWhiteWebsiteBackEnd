import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    patientInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    age: Number
   },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    date: {
        type: Date,
        required: true
    },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled", "rescheduled"],
        default: "pending"
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "online", null],
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    amount: {
        type: Number,
        required: true
    },
    history: [{
        action: { type: String, required: true },
        by: {
            type: mongoose.Schema.Types.Mixed, 
            default: null
        },
        at: { type: Date, default: Date.now }
    }],
    attended: {
        type: Boolean,
        default: true 
    },
    noShowHandled: {
        type: Boolean,
        default: false
    },


    rescheduleCount: { type: Number, default: 0 },

    transactionId: { type: String },
    paymentGateway: { type: String }, 

    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment"
    },


    notes: String,
    cancellationReason: String,
    cancellationMessage: String,

    cancellationWindowHours: { type: Number, default: 24 },
    isFirstTime: { type: Boolean, default: false },    
    
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    
    reminders: [{
        sentAt: Date,
        type: {
            type: String,
            enum: ["email", "sms", "push"]
        },
        status: {
           type: String,
            enum: ["pending", "sent", "failed"], 
            default: "pending" 
        },
         label: {
            type: String,
            enum: ['24h', '2h'],
        },
    }], 

    metadata: mongoose.Schema.Types.Mixed
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
    return this.date > new Date() && this.status === 'confirmed';
});

// Virtual for checking if appointment can be cancelled
appointmentSchema.virtual('canCancel').get(function () {
    const now = new Date();
    const cancelLimit = new Date(this.startTime);
    cancelLimit.setHours(cancelLimit.getHours() - this.cancellationWindowHours);
    return now < cancelLimit && this.status === 'confirmed';
});

appointmentSchema.index({ doctor: 1, startTime: 1 }, { unique: true });

appointmentSchema.index({
  'patientInfo.firstName': 'text',
  'patientInfo.lastName': 'text',
  'patientInfo.phone': 'text'
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;

