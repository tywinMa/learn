# 后台管理单元配置课程bug
- POST接口/api/admin/units保存单元内配置的课程的时候，每个单元下的courseIds是null
- 应该是把配置到该单元的课程id保存到courseIds字段，其他未选中的课程都在可选课程中去