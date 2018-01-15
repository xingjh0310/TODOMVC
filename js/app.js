;
(function () {
  // 我们需要让我们的 input 一上来就聚焦一次，以后不需要了
  // 所以我们这里就需要使用 bind 或者 inserted 钩子
  Vue.directive('focus', {
    // bind (el, binding) {
    //   console.log(el)
    //   // el.focus()
    //   // 你在这里可以该样式等其它操作
    //   // 但是唯一不能做的就是聚焦
    //   // 聚焦不能写在 bind 钩子函数
    //   el.style.color = 'red'
    // }
    // 当被绑定的元素插入到 DOM 中时……
    inserted: function (el) {
      // 聚焦元素
      el.focus()
    }
  })

  // 该指令被作用到了所有 li 中的 input 上了
  // 每当模板更新的时候，这些指令都会执行
  // 我在指令中就可以得到作用该指令的 DOM 元素
  // DOM 元素是谁？input
  // 如何知道双击了哪个任务项，从而找到 input
  // 这才是更 Vue 的代码，否则不会用的人写出来的代码就不够 Vue
  // 搞学习要较真儿，但是工作的时候别较真儿
  Vue.directive('todo-focus', {
    update (el, binding) {
      // console.log('todo-focus 指令所在模板更新了', el)
      // el.focus()
      console.log(binding.value) // currentEditing === item
      if (binding.value) {
        el.focus()
      }
    }
  })

  window.app = new Vue({
    data: {
      todos: JSON.parse(window.localStorage.getItem('todos') || '[]'),
      currentEditing: null,
      filterText: 'all'
    },

    // 计算属性是 Vue 提供的一大特色
    // 顾名思义：一种带有行为的属性，本质是方法，但是不能当作方法来调用，必须当作属性来使用
    // 它相比方法的优势就在于会缓存计算的结果，效率很高
    // 计算属性只能当作属性来使用，不能用于事件处理函数
    computed: {
      // 该成员就是一个方法，但是在使用的时候必须当作属性来用，不能调用
      // 简写方式，一个函数，作为 get 方法
      // remaningCount () {
      //   console.log('remaningCount 属性方法被调用了')
      //   return this.todos.filter(t => !t.completed).length
      // }
      remaningCount: {
        // 当你访问 remaningCount 会自动调用 get 方法
        get() {
          return this.todos.filter(t => !t.completed).length
        },
        // 当你 实例.remaningCount = xxx 的时候会自动调用 set 方法
        // 注意：这里只是为了演示语法
        set () {
          console.log('remaningCount 的 set 方法被调用了')
        }
      },

      toggleAllStat: {
        get () {
          // 计算属性知道它依赖了 todos
          // 当 todos 发生变化，计算属性会重新计算
          return this.todos.every(t => t.completed)
        },
        set () {
          // 表单控件 checkbox 双向绑定了 toggleAllStat
          // 所以 checkbox 的变化会调用 set 方法
          // 在 set 方法中我们要做的就是
          //    1. 得到当前 checkbox 的选中状态
          //    2. 把所有任务项的选项状态都设置为 toggle-all 的选中状态

          // 在自己的 set 方法中访问自己就是调用自己 get 方法
          // console.log(this.toggleAllStat)
          const checked = !this.toggleAllStat
          this.todos.forEach(item => {
            item.completed = checked
          })
        }
      },

      filterTodos () {
        // all
        // return this.todos

        // active
        // return this.todos.filter(t => !t.completed)

        // completed
        // return this.todos.filter(t => t.completed)

        switch(this.filterText) {
          case 'active':
            return this.todos.filter(t => !t.completed)
            break
          case 'completed':
            return this.todos.filter(t => t.completed)
            break
          default:
            return this.todos
            break
        }
      }
    },

    watch: {
      // 监视 todos 的改变，当 todos 发生变化的时候做业务定制处理
      // 引用类型只能监视一层，无法监视内部成员的子成员的改变
      todos: {
        // 当监视到 todos 改变的时候会自动调用 handler 方法
        // 你监视的谁，val 就是谁
        // val 的变化之后的最新值
        // oldVal 是变化之前的值
        handler (val, oldVal) {
          // 监视到 todos 变化，把 todos 本次存储记录数据的状态
          // 这里既可以通过 this.todos 来访问，也可以通过 val 来得到最新的 todos
          window.localStorage.setItem('todos', JSON.stringify(val))
        },
        deep: true, // 深度监视，只有这样才能监视到数组或者对象孩子...孩子... 成员的改变
        // immediate: true // 无乱变化与否，你上来就给我调用一次，如何使用看需求
      }
    },

    methods: {
      handleNewTodoKeyDown(e) {
        // 0. 注册按下的回车事件
        // 1. 获取文本框的内容
        // 2. 数据校验
        // 3. 添加到 todos 列表
        // 4. 清空文本框
        // console.log(this.todoText)
        const target = e.target
        const value = target.value.trim()
        if (!value.length) {
          return
        }
        const todos = this.todos
        todos.push({
          // 如果数组是空的就给 1 ，否则就是最后一个元素的 id + 1
          id: todos.length ? todos[todos.length - 1].id + 1 : 1,
          title: value,
          completed: false
        })
        target.value = ''
      },

      handleToggleAllChange(e) {
        // 0. 绑定 checkbox 的 change 事件
        // 1. 获取 checkbox 的选中的状态
        // 2. 直接循环所有的子任务项的选中状态设置为 toggleAll 的状态
        const checked = e.target.checked
        this.todos.forEach(item => {
          item.completed = checked
        })
      },

      handleRemoveTodoClick(index, e) {
        this.todos.splice(index, 1)
      },

      handleGetEditingDblclick(todo) {
        // 把这个变量等于当前双击的 todo
        this.currentEditing = todo
      },

      // 编辑任务，敲回车保存编辑
      handleSaveEditKeydown(todo, index, e) {
        // 0. 注册绑定事件处理函数
        // 1. 获取编辑文本框的数据
        // 2. 数据校验
        //    如果数据是空的，则直接删除该元素
        //    否则保存编辑
        const target = e.target
        const value = target.value.trim()

        // 数据被编辑为空的了，直接删除
        if (!value.length) {
          this.todos.splice(index, 1)
        } else {
          todo.title = value
          this.currentEditing = null
        }
      },

      handleCancelEditEsc() {
        // 1. 把样式给去除
        this.currentEditing = null
      },

      handleClearAllDoneClick() {
        // 错误的写法
        // this.todos.forEach((item, index) => {
        //   if (item.completed) {
        //     this.todos.splice(index, 1)
        //   }
        // })

        // 手动控制遍历索引的方式
        // for (let i = 0; i < this.todos.length; i++) {
        //   if (this.todos[i].completed) {
        //     this.todos.splice(i, 1)
        //     // 删除元素之后，让我们遍历的这个 小索引 往后倒退一次，
        //     // 因为你删除之后，后面的所有元素的索引都会倒退一次
        //     // 纠正索引的遍历
        //     i--
        //   }
        // }

        // 过滤结果的方式
        // 我们这里还有一种办法也很简单
        // 我们把需要的结果给过滤出来重新赋值到 todos 中
        this.todos = this.todos.filter(t => !t.completed)
      },

      // 获取剩余的任务数量
      // 后来把这个方法改为了计算属性
      getRemaningCount() {
        console.log(111)
        return this.todos.filter(t => !t.completed).length
      }
    }
  }).$mount('#app')

  // 页面初始化的时候调用一次，保持过滤状态
  handlehashchange()

  // 该事件在页面初始化的时候不会执行，只有 change 的才会执行
  // 注册 hash（锚点） 的改变事件
  window.onhashchange = handlehashchange

  function handlehashchange() {
    app.filterText = window.location.hash.substr(2)
  }
})()
