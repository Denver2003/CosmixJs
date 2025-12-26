//
//  cosmixAppDelegate.cpp
//  cosmix
//
//  Created by Den on 30.10.12.
//  Copyright __MyCompanyName__ 2012. All rights reserved.
//

#include "AppDelegate.h"

#include "cocos2d.h"
#include "HelloWorldScene.h"
#include "LoadingScene.h"
#include "Test.h"


USING_NS_CC;

typedef struct tagResource
{
    CCSize sizeInPixel;
    CCSize sizeDesign;
    char directory[100];
}Resource;


static Resource resPhone        =  { CCSizeMake(320, 480), CCSizeMake(320, 480), "sd" };
static Resource resPhoneRetina  =  { CCSizeMake(640, 960), CCSizeMake(320, 480), "hd"   };
static Resource resTable        =  { CCSizeMake(768, 1024), CCSizeMake(768, 1024), "hd"   };
static Resource resPhone5Retina =  { CCSizeMake(640, 1136), CCSizeMake(320, 568), "hd"   };

static Resource resPhone6Retina     =  { CCSizeMake(740, 1334), CCSizeMake(320, 568), "hd"   };
static Resource resPhone6PlusRetina =  { CCSizeMake(1080, 1920), CCSizeMake(320, 568), "hd"   };

static Resource resTableRetina  =  { CCSizeMake(1536,2048), CCSizeMake(768, 1024), "ipadhd" };


AppDelegate::AppDelegate()
{

}

AppDelegate::~AppDelegate()
{
}

bool AppDelegate::applicationDidFinishLaunching()
{
    
    // initialize director
    CCDirector *pDirector = CCDirector::sharedDirector();
    pDirector->setOpenGLView(CCEGLView::sharedOpenGLView());
    
    ///////////////////////////// retina support solution start
    CCEGLView* pEGLView = CCEGLView::sharedOpenGLView();
    CCSize frameSize = pEGLView->getFrameSize();


    Resource actualResource;
    float actualHeight = max(frameSize.width, frameSize.height);
    
    CCLOG("!!!!!! resolution size %d ",actualHeight);
    
    if (actualHeight > resPhone6PlusRetina.sizeInPixel.height)
    {
        actualResource = resTableRetina;
    }else if (actualHeight > resPhone6Retina.sizeInPixel.height)
    {
        actualResource = resPhone6PlusRetina;
    }else
        if (actualHeight > resPhone5Retina.sizeInPixel.height)
    {
        actualResource = resPhone6Retina;
    }else if (actualHeight > resTable.sizeInPixel.height)
    {
        actualResource = resPhone5Retina;
    }
    else if (actualHeight > resPhoneRetina.sizeInPixel.height)
    {
        actualResource = resTable;
    } else if (actualHeight > resPhone.sizeInPixel.height)
    {
        actualResource = resPhoneRetina;
    } else
    {
        actualResource = resPhone;
    }
    CCFileUtils::sharedFileUtils()->setResourceDirectory(actualResource.directory);
    pDirector->setContentScaleFactor(actualResource.sizeInPixel.height / actualResource.sizeDesign.height);
    // Set the design resolution
    pEGLView->setDesignResolutionSize(actualResource.sizeDesign.width, actualResource.sizeDesign.height, kResolutionNoBorder);

	// for PC
#ifdef _WINDOWS
	CCFileUtils::sharedFileUtils()->setResourceDirectory("hd");
	pDirector->setContentScaleFactor(2);
	pEGLView->setDesignResolutionSize(320, 480, kResolutionNoBorder);
#endif

    ///////////////////////////// retina support solution end
    Test::getInstance()->takeOff();
    
        //TargetPlatform target = getTargetPlatform();
    
    
    /*if (target == kTargetIpad)
    {
        // ipad
        
        CCFileUtils::sharedFileUtils()->setResourceDirectory("hd");

        if (pDirector->enableRetinaDisplay(true)) {
            CCFileUtils::sharedFileUtils()->setResourceDirectory( "ipadhd" );
        }
        
    }else
    {
        CCFileUtils::sharedFileUtils()->setResourceDirectory( "sd" );
        
        if (pDirector->enableRetinaDisplay(true)) {
            
            
            CCFileUtils::sharedFileUtils()->setResourceDirectory( "hd" );
            
        }
        
    }*/
    

    // turn on display FPS
    //pDirector->setDisplayStats(true);

    // set FPS. the default value is 1.0/60 if you don't call this
    pDirector->setAnimationInterval(1.0 / 60);

    // create a scene. it's an autorelease object
    //CCScene *pScene = HelloWorld::scene();
	CCScene *pScene = LoadingScene::scene();

    // run
    pDirector->runWithScene(pScene);

    return true;
}

// This function will be called when the app is inactive. When comes a phone call,it's be invoked too
void AppDelegate::applicationDidEnterBackground()
{
    CCDirector::sharedDirector()->stopAnimation();

    // if you use SimpleAudioEngine, it must be paused
    // SimpleAudioEngine::sharedEngine()->pauseBackgroundMusic();
}

// this function will be called when the app is active again
void AppDelegate::applicationWillEnterForeground()
{
    CCDirector::sharedDirector()->startAnimation();
    
    // if you use SimpleAudioEngine, it must resume here
    // SimpleAudioEngine::sharedEngine()->resumeBackgroundMusic();
}
