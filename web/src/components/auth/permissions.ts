import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  userAc,
  adminAc,
} from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

// 테스트용으로 user 역할에 "list" 권한을 추가했습니다. 실제로는 필요에 따라 권한을 구성하시면 됩니다.
export const user = ac.newRole({
  ...userAc.statements,
  user: [...userAc.statements.user, "list"],
});

export const admin = ac.newRole(adminAc.statements);
