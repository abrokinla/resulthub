from rest_framework.permissions import BasePermission


ROLE_PERMISSIONS = {
    'ADMIN': [
        'users.manage_staff',
        'users.manage_teachers',
        'classes.manage',
        'classes.assign_teacher',
        'subjects.manage',
        'subjects.assign_teacher',
        'students.manage',
        'scores.manage',
        'results.approve',
        'results.publish',
        'results.export',
        'results.print',
        'settings.manage',
        'terms.manage',
        'attendance.manage',
        'reports.view',
        'communication.send',
        'promotion.process',
    ],
    'PRINCIPAL': [
        'users.manage_teachers',
        'classes.manage',
        'classes.assign_teacher',
        'subjects.manage',
        'subjects.assign_teacher',
        'students.view',
        'scores.view',
        'results.approve',
        'results.publish',
        'results.export',
        'results.print',
        'settings.view',
        'attendance.view',
        'reports.view',
        'promotion.process',
    ],
    'VICE_PRINCIPAL': [
        'classes.view',
        'subjects.view',
        'students.view',
        'scores.view',
        'results.approve',
        'results.export',
        'results.print',
        'attendance.view',
        'reports.view',
    ],
    'SECRETARY': [
        'classes.view',
        'students.manage',
        'scores.view',
        'results.export',
        'results.print',
        'communication.send',
    ],
    'ACCOUNTANT': [
        'students.view',
        'reports.view',
        'results.print',
    ],
    'TEACHER': [
        'classes.view_own',
        'subjects.view_own',
        'students.view_own',
        'scores.manage_own',
        'results.view_own',
        'results.submit',
        'attendance.manage_own',
        'profile.manage',
    ],
}

MANAGEMENT_ROLES = ['ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'SECRETARY']

SECTION_GROUP_MAP = {
    'nursery_primary': ['NURSERY', 'PRIMARY'],
    'secondary': ['JUNIOR_SECONDARY', 'SENIOR_SECONDARY'],
}


class HasPermission(BasePermission):
    def __init__(self, *perms):
        self.perms = perms

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        user_perms = ROLE_PERMISSIONS.get(request.user.role, [])
        return any(p in user_perms for p in self.perms)


def user_has_permission(user, permission):
    return permission in ROLE_PERMISSIONS.get(user.role, [])


def is_management_role(role):
    return role in MANAGEMENT_ROLES
