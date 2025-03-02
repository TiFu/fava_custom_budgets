

class NestedDictionary:
    def __init__(self, defaultValue = 0):
        self.content = {}
        self.defaultValue = defaultValue

    def getDict(self):
        return self.content
            
    def getKeys(self, *args):
        level = self.content
        for arg in args:
            if arg in level:
                level = level[arg]
            else:
                return []
        return level.keys()


    def hasKey(self, *args):
        level = self.content
        for arg in args:
            if arg in level:
                level = level[arg]
            else:
                return False
        return True


    def increase(self, value, *args):
        currentVal = self.get(*args)
        newVal = value + currentVal
        self.set(newVal, *args)
        return newVal

    def get(self, *args):
        level = self.content
        for arg in args:
            if arg in level:
                level = level[arg]
            else:
                return self.defaultValue
        return level
        
        
    def set(self, value, *args):
        level = self.content
        for i in range(len(args)-1):
            arg = args[i]
            if arg not in level:
                level[arg] = {}

            level = level[arg]

        # 
        arg = args[len(args) -1]
        level[arg] = value
        #print(self.content)

if __name__ == "__main__":
    d = NestedDictinory(0)
    print(d.get(2024, 12, "test"))

    d.increase(42, 2024, 12, "test")

    print(d.get(2024, 12, "test"))

    d.increase(10, 2024, 12, "test")
    print(d.get(2024, 12, "test"))
