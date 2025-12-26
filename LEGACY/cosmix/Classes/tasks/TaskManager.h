//
//  TaskManager.h
//  cosmix
//
//  Created by denver on 03.09.13.
//
//

#ifndef __cosmix__TaskManager__
#define __cosmix__TaskManager__

#include "Task.h"

#define TASK_COUNT_PER_GAME 3
class CTaskManager : public CCObject
{
public:
    // шаблоны типовых задач
    std::map<int, CTask *> mapTasksInfo;
    //полный список задач в виде карты ключ - значение
    // где в качестве ключа - уникальный номер задачи
    std::map<int, CTask *> mapTasksList;
    // отсортированный список этих задач в порядке выполнения
    std::vector<CTask *> sortedTasksList;
    
    std::vector<std::string> tutorialLabels;
    
    std::vector<std::string> colorNames;
    
    // выбранные задачи для текущего уровня
    std::vector< CTask * > currentTasks;
    
    bool isTutorialGame;
    
    void clearTasks();
    void fillLevelTasks();   // загрузка текущих задач для уровня
    
    void loadListOfTasks(); //загрузка списка всех задач из файла
    CTask * findTaskInfo(int _id);
    
    void loadCurrentTasks(void);
    void saveCurrentTasksOnGameOver(void);
    std::vector<CTask *> getTasksByType(int type);
    
    
    bool isTutorial(void){return isTutorialGame;};
    std::string updateText(std::string _text);
    
public:
    static CTaskManager * getInstance(void);
    static void destroyInstance(void);
private:
    static CTaskManager * theInstance;
    CTaskManager();
    ~CTaskManager();
};

#endif /* defined(__cosmix__TaskManager__) */
