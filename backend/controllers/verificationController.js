const Verification = require('../models/Verification');
const User = require('../models/User');

// POST /api/verification/id - Submit ID verification
// Accepts base64 encoded file or file URL
exports.submitIDVerification = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { idType, idNumber, idDocument } = req.body;
        
        if (!idType || !idNumber) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'ID type and ID number are required' 
            });
        }

        if (!idDocument) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'ID document is required (base64 data or URL)' 
            });
        }

        // Validate file type if base64
        if (idDocument.startsWith('data:')) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            const mimeType = idDocument.match(/data:([^;]+);/)?.[1];
            if (!mimeType || !allowedTypes.includes(mimeType)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.' 
                });
            }
        }

        // Store document data (base64 or URL)
        // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
        const documentData = idDocument; // Store as-is for now
        
        const verification = await Verification.findOneAndUpdate(
            { user: user._id, type: 'id' },
            {
                user: user._id,
                type: 'id',
                status: 'pending', // In production, this would be processed by admin/automated system
                'data.documentUrl': documentData,
                'data.documentType': idType,
                'data.idNumber': idNumber,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            { upsert: true, new: true }
        );

        // Update user verification status
        user.verificationDocuments = user.verificationDocuments || {};
        user.verificationDocuments.idFront = documentData;
        user.verificationDocuments.verifiedAt = null; // Will be set when approved
        await user.save();

        console.log(`✅ ID verification submitted for user ${user._id}`);

        res.json({
            status: 'success',
            message: 'ID verification submitted successfully. Your document is under review.',
            verification: {
                id: verification._id,
                type: verification.type,
                status: verification.status,
                submittedAt: verification.createdAt
            }
        });
    } catch (err) {
        console.error('Submit ID verification error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit ID verification' });
    }
};

// POST /api/verification/biometric - Submit biometric verification
exports.submitBiometricVerification = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { biometricData } = req.body;
        
        if (!biometricData) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Biometric data is required' 
            });
        }

        // In production, this would use WebAuthn API or fingerprint scanner
        // For now, we accept the biometric data and mark as pending
        const verification = await Verification.findOneAndUpdate(
            { user: user._id, type: 'biometric' },
            {
                user: user._id,
                type: 'biometric',
                status: 'pending',
                'data.biometricData': biometricData,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            { upsert: true, new: true }
        );

        // Update user verification status
        user.verificationDocuments = user.verificationDocuments || {};
        user.verificationDocuments.biometricData = biometricData;
        await user.save();

        console.log(`✅ Biometric verification submitted for user ${user._id}`);

        res.json({
            status: 'success',
            message: 'Biometric verification submitted successfully. Your data is under review.',
            verification: {
                id: verification._id,
                type: verification.type,
                status: verification.status,
                submittedAt: verification.createdAt
            }
        });
    } catch (err) {
        console.error('Submit biometric verification error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit biometric verification' });
    }
};

// POST /api/verification/face - Submit face verification
exports.submitFaceVerification = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { faceData } = req.body;
        
        if (!faceData) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Face data is required' 
            });
        }

        // In production, this would use face recognition API
        const verification = await Verification.findOneAndUpdate(
            { user: user._id, type: 'face' },
            {
                user: user._id,
                type: 'face',
                status: 'pending',
                'data.faceData': faceData,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
            { upsert: true, new: true }
        );

        // Update user verification status
        user.verificationDocuments = user.verificationDocuments || {};
        user.verificationDocuments.faceData = faceData;
        await user.save();

        console.log(`✅ Face verification submitted for user ${user._id}`);

        res.json({
            status: 'success',
            message: 'Face verification submitted successfully. Your data is under review.',
            verification: {
                id: verification._id,
                type: verification.type,
                status: verification.status,
                submittedAt: verification.createdAt
            }
        });
    } catch (err) {
        console.error('Submit face verification error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit face verification' });
    }
};

// GET /api/verification/status - Get verification status for current user
exports.getVerificationStatus = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const verifications = await Verification.find({ user: user._id })
            .sort({ createdAt: -1 });

        const status = {
            email: { status: 'not_verified', verifiedAt: null },
            phone: { status: 'not_verified', verifiedAt: null },
            id: { status: 'not_verified', verifiedAt: null },
            biometric: { status: 'not_verified', verifiedAt: null },
            face: { status: 'not_verified', verifiedAt: null }
        };

        verifications.forEach(ver => {
            if (status[ver.type]) {
                status[ver.type] = {
                    status: ver.status,
                    verifiedAt: ver.result?.verifiedAt || null,
                    submittedAt: ver.createdAt
                };
            }
        });

        // Also check user verification status
        if (user.verificationStatus) {
            if (user.verificationStatus.email) status.email.status = 'approved';
            if (user.verificationStatus.phone) status.phone.status = 'approved';
            if (user.verificationStatus.id) status.id.status = 'approved';
            if (user.verificationStatus.biometric) status.biometric.status = 'approved';
            if (user.verificationStatus.face) status.face.status = 'approved';
        }

        res.json({
            status: 'success',
            verifications: status,
            overallStatus: user.verification?.status || 'not_verified'
        });
    } catch (err) {
        console.error('Get verification status error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to load verification status' });
    }
};


