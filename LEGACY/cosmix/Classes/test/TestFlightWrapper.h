//
//  TestFlightWrapper.h
//
//  Created by haxpor on 4/9/13.
//
//

#ifndef __TestFlightWrapper__
#define __TestFlightWrapper__

#include <typeinfo>
#include <string>

namespace TestFlightWrapper {
    
    /* As SimpleAudioEngine in cocos2d-x has it, so this class should have. It makes no harm. */
    class TypeInfo
    {
    public:
        virtual long getClassTypeInfo() = 0;
    };
    
    static inline unsigned int getHashCodeByString(const char *key)
    {
        unsigned int len = strlen(key);
        const char *end=key+len;
        unsigned int hash;
        
        for (hash = 0; key < end; key++)
        {
            hash *= 16777619;
            hash ^= (unsigned int) (unsigned char) toupper(*key);
        }
        return (hash);
    }
    /* -- */
    
    class TestFlightWrapper : public TypeInfo
    {
    public:
        TestFlightWrapper();
        ~TestFlightWrapper();
        
        virtual long getClassTypeInfo() {
            return getHashCodeByString(typeid(TestFlightWrapper::TestFlightWrapper).name());
        }
        
        static TestFlightWrapper* sharedWrapper();
        
        void addCustomEnvironmentInformation(const char* information, const char* key);
        void takeOff(const char* applicationToken);
        /* void setOptions(NSDictionary* options); */ // we don't support yet!
        void passCheckpoint(const char* checkpointName);
        void openFeedbackView();
        void submitFeedback(const char* feedback);
        void setDeviceIdentifier(const char* deviceIdentifier);
        void log(const char *strFormat, ...);
        
        // -- key of options (will be used when setOptions() function is finally supported) ---
        //static const char* TFOptionAttachBacktraceToFeedback_utf8String;
        static const char* TFOptionDisableInAppUpdates_utf8String;
        static const char* TFOptionLogToConsole_utf8String;
        static const char* TFOptionLogToSTDERR_utf8String;
        static const char* TFOptionReinstallCrashHandlers_utf8String;
        static const char* TFOptionSendLogOnlyOnCrash_utf8String;
    };
    
};  // end of namespace

#endif /* defined(__TestFlightWrapper__) */